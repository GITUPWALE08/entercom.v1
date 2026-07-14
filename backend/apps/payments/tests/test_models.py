import pytest
from django.db import IntegrityError
from django.core.exceptions import ValidationError
from apps.payments.models.payment import Payment, PaymentStatus
import uuid

pytestmark = pytest.mark.django_db

def test_test_pay_001_unique_paystack_reference(customer_user, request_obj, order):
    """
    Inventory:
        TEST-PAY-001
    Rule:
        Unique paystack_reference
    """
    Payment.objects.create(
        order=order,
        request=request_obj,
        customer=customer_user,
        provider_reference="REF-12345",
        amount=100.00,
        correlation_id=uuid.uuid4()
    )
    
    from apps.requests.models import Request
    req2 = Request.objects.create(public_id="REQ-TEST-UNIQUE", customer=customer_user, category="PRODUCT_ORDER", description="test")
    from apps.orders.models import Order
    order2 = Order.objects.create(request=req2, customer=customer_user, total_amount=100)
    
    with pytest.raises(IntegrityError):
        Payment.objects.create(
            order=order2,
            request=req2,
            customer=customer_user,
            provider_reference="REF-12345",
            amount=100.00,
            correlation_id=uuid.uuid4()
        )

def test_test_pay_002_one_order_one_payment(customer_user, request_obj, order):
    """
    Inventory:
        TEST-PAY-002
    Rule:
        One order one payment
    """
    Payment.objects.create(
        order=order,
        request=request_obj,
        customer=customer_user,
        provider_reference="REF-1",
        amount=100.00,
        correlation_id=uuid.uuid4()
    )
    
    with pytest.raises(IntegrityError):
        Payment.objects.create(
            order=order,
            request=request_obj,
            customer=customer_user,
            provider_reference="REF-2",
            amount=50.00,
            correlation_id=uuid.uuid4()
        )

def test_test_pay_003_state_validation_constraints(customer_user, request_obj, order):
    """
    Inventory:
        TEST-PAY-003
    Rule:
        State validation constraints
    """
    payment = Payment(
        order=order,
        request=request_obj,
        customer=customer_user,
        provider_reference="REF-1",
        amount=100.00,
        status="INVALID_STATUS",
        correlation_id=uuid.uuid4()
    )
    
    with pytest.raises(ValidationError):
        payment.full_clean()

