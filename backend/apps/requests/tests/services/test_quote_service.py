import pytest
from django.contrib.auth import get_user_model
from django.utils import timezone
from datetime import timedelta
from apps.requests.models import Request, LifecycleState, Quote, QuoteStatus
from apps.requests.services.quote_service import QuoteService
from apps.requests.domain.exceptions import RuleViolationError, InvalidTransitionError

User = get_user_model()

@pytest.fixture
def customer_user(db):
    return User.objects.create(email="customer@test.com", role="CUSTOMER")

@pytest.fixture
def tech_user(db):
    return User.objects.create(email="tech@test.com", role="TECHNICIAN")

@pytest.fixture
def awaiting_quote_request(customer_user, tech_user):
    req = Request.objects.create(
        public_id="REQ-TEST-QUOTE",
        customer=customer_user,
        assigned_technician=tech_user,
        category="installation",
        status=LifecycleState.AWAITING_QUOTE,
        description="Test quote"
    )
    return req

@pytest.mark.django_db(transaction=True)
class TestQuoteService:

    def test_quote_creation(self, tech_user, awaiting_quote_request):
        quote = QuoteService.create_quote(
            request_id=awaiting_quote_request.id,
            actor=tech_user,
            data={"amount": 100.50}
        )
        assert quote.version == 1
        assert quote.amount == 100.50
        assert quote.status == QuoteStatus.ISSUED
        
        awaiting_quote_request.refresh_from_db()
        assert awaiting_quote_request.status == LifecycleState.AWAITING_CUSTOMER_APPROVAL

    def test_quote_revision_limit(self, customer_user, tech_user, awaiting_quote_request):
        # Create quote v1
        QuoteService.create_quote(request_id=awaiting_quote_request.id, actor=tech_user, data={"amount": 100.0})
        # Customer requests revision
        QuoteService.handle_customer_action(request_id=awaiting_quote_request.id, actor=customer_user, action_type="revise")
        
        # Create quote v2
        QuoteService.create_quote(request_id=awaiting_quote_request.id, actor=tech_user, data={"amount": 110.0})
        # Customer requests revision
        QuoteService.handle_customer_action(request_id=awaiting_quote_request.id, actor=customer_user, action_type="revise")
        
        # Create quote v3
        QuoteService.create_quote(request_id=awaiting_quote_request.id, actor=tech_user, data={"amount": 120.0})
        
        # Attempt 4th revision escalates the request
        QuoteService.handle_customer_action(request_id=awaiting_quote_request.id, actor=customer_user, action_type="revise")
        awaiting_quote_request.refresh_from_db()
        assert awaiting_quote_request.status == LifecycleState.ESCALATED

    def test_quote_reject(self, customer_user, tech_user, awaiting_quote_request):
        quote = QuoteService.create_quote(request_id=awaiting_quote_request.id, actor=tech_user, data={"amount": 100.0})
        QuoteService.handle_customer_action(request_id=awaiting_quote_request.id, actor=customer_user, action_type="reject")
        
        quote.refresh_from_db()
        assert quote.status == QuoteStatus.REJECTED
        awaiting_quote_request.refresh_from_db()
        assert awaiting_quote_request.status == LifecycleState.AWAITING_QUOTE

    def test_quote_approve(self, customer_user, tech_user, awaiting_quote_request):
        quote = QuoteService.create_quote(request_id=awaiting_quote_request.id, actor=tech_user, data={"amount": 100.0})
        QuoteService.approve_quote(request_id=awaiting_quote_request.id, actor=customer_user)
        
        quote.refresh_from_db()
        assert quote.status == QuoteStatus.APPROVED
        awaiting_quote_request.refresh_from_db()
        assert awaiting_quote_request.status == LifecycleState.AWAITING_PAYMENT

    def test_quote_expiration(self, customer_user, tech_user, awaiting_quote_request):
        quote = QuoteService.create_quote(request_id=awaiting_quote_request.id, actor=tech_user, data={"amount": 100.0})
        # Manually expire
        quote.expires_at = timezone.now() - timedelta(days=1)
        quote.save()
        
        with pytest.raises(RuleViolationError, match="expired"):
            QuoteService.approve_quote(request_id=awaiting_quote_request.id, actor=customer_user)

    def test_quote_superseded(self, customer_user, tech_user, awaiting_quote_request):
        quote1 = QuoteService.create_quote(request_id=awaiting_quote_request.id, actor=tech_user, data={"amount": 100.0})
        QuoteService.handle_customer_action(request_id=awaiting_quote_request.id, actor=customer_user, action_type="revise")
        
        quote2 = QuoteService.create_quote(request_id=awaiting_quote_request.id, actor=tech_user, data={"amount": 110.0})
        
        quote1.refresh_from_db()
        assert quote1.status == QuoteStatus.SUPERSEDED
