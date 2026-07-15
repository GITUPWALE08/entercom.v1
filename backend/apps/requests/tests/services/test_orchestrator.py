import pytest
from datetime import timedelta
from django.utils import timezone
from unittest.mock import patch
from django.contrib.auth import get_user_model
from apps.requests.models import Request, LifecycleState, Quote, QuoteStatus, Verification, VerificationStatus
from apps.requests.services.request_process_orchestrator import RequestProcessOrchestrator
from apps.requests.services.quote_service import QuoteService
from apps.requests.services.verification_service import VerificationService
from apps.orders.models import Order, OrderStatus

User = get_user_model()

@pytest.mark.django_db(transaction=True)
class TestRequestProcessOrchestrator:

    def setup_method(self):
        self.customer = User.objects.create(email="customer@test.com", role="CUSTOMER")
        self.staff = User.objects.create(email="staff@test.com", role="STAFF")
        self.tech = User.objects.create(email="tech@test.com", role="TECHNICIAN")
        self.manager = User.objects.create(email="manager@test.com", role="MANAGER")

    @patch('core.events.event_publisher.publish')
    def test_sync_after_quote_approval_no_payment(self, mock_publish):
        """
        Quote approved -> no payment required -> should move to AWAITING_ASSIGNMENT
        """
        req = Request.objects.create(
            public_id="REQ-1",
            customer=self.customer,
            category="support", # support typically doesn't require upfront payment, but quote can be issued
            status=LifecycleState.AWAITING_CUSTOMER_APPROVAL
        )
        quote = Quote.objects.create(
            request=req,
            version=1,
            amount=100.0,
            status=QuoteStatus.ISSUED,
            created_by=self.staff,
            expires_at=timezone.now() + timedelta(days=30)
        )

        QuoteService.handle_customer_action(req.id, self.customer, "approve")
        
        req.refresh_from_db()
        # Approve quote -> no payment -> orchestrator syncs -> AWAITING_ASSIGNMENT
        assert req.status == LifecycleState.AWAITING_ASSIGNMENT

    @patch('core.events.event_publisher.publish')
    def test_sync_after_quote_approval_requires_payment(self, mock_publish):
        """
        Quote approved -> payment required -> should move to AWAITING_PAYMENT
        """
        req = Request.objects.create(
            public_id="REQ-2",
            customer=self.customer,
            category="installation", # installation requires upfront payment
            status=LifecycleState.AWAITING_CUSTOMER_APPROVAL
        )
        quote = Quote.objects.create(
            request=req,
            version=1,
            amount=100.0,
            status=QuoteStatus.ISSUED,
            created_by=self.staff,
            expires_at=timezone.now() + timedelta(days=30)
        )

        QuoteService.handle_customer_action(req.id, self.customer, "approve")
        
        req.refresh_from_db()
        assert req.status == LifecycleState.AWAITING_PAYMENT

    @patch('core.events.event_publisher.publish')
    def test_sync_after_payment_paid(self, mock_publish):
        """
        Payment Paid -> should move to AWAITING_ASSIGNMENT via orchestrator
        """
        from apps.orders.services.order_service import OrderService

        req = Request.objects.create(
            public_id="REQ-3",
            customer=self.customer,
            category="installation",
            status=LifecycleState.AWAITING_PAYMENT
        )
        order = Order.objects.create(
            request_id=req.id,
            customer_id=self.customer.id,
            status=OrderStatus.PENDING_PAYMENT,
            total_amount=100.0
        )

        OrderService.process_payment_paid_event(self.customer, "corr_id", order.id)
        
        req.refresh_from_db()
        assert req.status == LifecycleState.IN_PROGRESS

    @patch('core.events.event_publisher.publish')
    def test_sync_after_verification_approved(self, mock_publish):
        """
        Verification Approved -> should move to COMPLETED via orchestrator
        """
        req = Request.objects.create(
            public_id="REQ-4",
            customer=self.customer,
            category="installation",
            status=LifecycleState.PENDING_VERIFICATION,
            assigned_technician=self.tech
        )
        verif = Verification.objects.create(
            request=req,
            status=VerificationStatus.PENDING
        )

        VerificationService.verify(req.id, self.staff, "approve")
        
        req.refresh_from_db()
        assert req.status == LifecycleState.COMPLETED
