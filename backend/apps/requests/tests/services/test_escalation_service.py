import pytest
from django.contrib.auth import get_user_model
from apps.requests.models import Request, LifecycleState, Escalation, EscalationStatus, EscalationReasonCode
from apps.requests.services.escalation_service import EscalationService

User = get_user_model()

@pytest.fixture
def customer_user(db):
    return User.objects.create(email="customer@test.com", role="customer")

@pytest.fixture
def staff_user(db):
    return User.objects.create(email="staff@test.com", role="staff")

@pytest.fixture
def manager_user(db):
    return User.objects.create(email="manager@test.com", role="manager")

@pytest.fixture
def submitted_request(customer_user):
    return Request.objects.create(
        public_id="REQ-TEST-ESC",
        customer=customer_user,
        category="installation",
        status=LifecycleState.SUBMITTED,
        description="Test escalation"
    )

@pytest.mark.django_db(transaction=True)
class TestEscalationService:

    def test_manual_escalation(self, manager_user, submitted_request):
        escalation = EscalationService.process_escalation(
            request_id=submitted_request.id,
            trigger_type="MANUAL",
            actor=manager_user
        )
        assert escalation.status == EscalationStatus.PENDING
        assert escalation.reason == EscalationReasonCode.MANUAL_MANAGER_REVIEW
        
        submitted_request.refresh_from_db()
        assert submitted_request.status == LifecycleState.ESCALATED

    def test_sla_breach_escalation(self, submitted_request):
        # Auto-escalation without an actor
        escalation = EscalationService.process_escalation(
            request_id=submitted_request.id,
            trigger_type="SLA_BREACH"
        )
        assert escalation.status == EscalationStatus.PENDING
        assert escalation.reason == EscalationReasonCode.SLA_BREACH
        
        submitted_request.refresh_from_db()
        assert submitted_request.status == LifecycleState.ESCALATED

    def test_priority_increase(self, manager_user, submitted_request):
        # Escalation typically increases priority to emergency 
        EscalationService.process_escalation(
            request_id=submitted_request.id,
            trigger_type="MANUAL",
            actor=manager_user
        )
        submitted_request.refresh_from_db()
        assert submitted_request.priority == "emergency"

    def test_manager_resolution(self, manager_user, submitted_request):
        EscalationService.process_escalation(
            request_id=submitted_request.id,
            trigger_type="SLA_BREACH"
        )
        
        EscalationService.resolve(
            request_id=submitted_request.id,
            actor=manager_user,
            target_state=LifecycleState.AWAITING_ASSIGNMENT,
            resolution_type="Re-assigned to queue"
        )
        
        submitted_request.refresh_from_db()
        assert submitted_request.status == LifecycleState.AWAITING_ASSIGNMENT
        
        escalation = Escalation.objects.filter(request=submitted_request).latest("created_at")
        assert escalation.status == EscalationStatus.RESOLVED
        assert escalation.resolved_by == manager_user
