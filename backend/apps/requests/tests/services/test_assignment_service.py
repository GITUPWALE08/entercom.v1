import pytest
from django.contrib.auth import get_user_model
from apps.requests.models import Request, LifecycleState, Assignment, StateHistory
from apps.requests.services.assignment_service import AssignmentService
from apps.audit_logs.models import AuditLogEntry
from apps.requests.domain.exceptions import InvalidTransitionError

User = get_user_model()

@pytest.fixture
def customer_user(db):
    return User.objects.create(email="customer@test.com", role="customer")

@pytest.fixture
def staff_user(db):
    return User.objects.create(email="staff@test.com", role="staff")

@pytest.fixture
def tech_user(db):
    return User.objects.create(email="tech@test.com", role="technician")

@pytest.fixture
def awaiting_assignment_request(customer_user):
    return Request.objects.create(
        public_id="REQ-TEST-ASSIGN",
        customer=customer_user,
        category="installation",
        status=LifecycleState.AWAITING_ASSIGNMENT,
        description="Test assignment"
    )

@pytest.mark.django_db(transaction=True)
class TestAssignmentService:
    def test_assign_success(self, staff_user, tech_user, awaiting_assignment_request):
        result = AssignmentService.assign(
            request_id=awaiting_assignment_request.id,
            actor=staff_user,
            technician_id=tech_user.id
        )
        assert result.status == LifecycleState.ASSIGNED
        assert result.assigned_technician == tech_user
        assert Assignment.objects.filter(request=result, technician=tech_user).count() == 1

    def test_assign_twice_fails(self, staff_user, tech_user, awaiting_assignment_request):
        AssignmentService.assign(
            request_id=awaiting_assignment_request.id,
            actor=staff_user,
            technician_id=tech_user.id
        )
        with pytest.raises(InvalidTransitionError):
            AssignmentService.assign(
                request_id=awaiting_assignment_request.id,
                actor=staff_user,
                technician_id=tech_user.id
            )

    def test_assign_cancelled_request_fails(self, staff_user, tech_user, awaiting_assignment_request):
        awaiting_assignment_request.status = LifecycleState.CANCELLED
        awaiting_assignment_request.save()
        with pytest.raises(InvalidTransitionError):
            AssignmentService.assign(
                request_id=awaiting_assignment_request.id,
                actor=staff_user,
                technician_id=tech_user.id
            )

    def test_reassign_flow(self, staff_user, tech_user, awaiting_assignment_request):
        # Assign first
        req = AssignmentService.assign(
            request_id=awaiting_assignment_request.id,
            actor=staff_user,
            technician_id=tech_user.id
        )
        # Tech declines
        req = AssignmentService.decline(
            request_id=req.id,
            actor=tech_user,
            reason_code="unavailable"
        )
        assert req.status == LifecycleState.AWAITING_ASSIGNMENT
        
        tech2 = User.objects.create(email="tech2@test.com", role="technician")
        # Re-assign to tech2
        req = AssignmentService.assign(
            request_id=req.id,
            actor=staff_user,
            technician_id=tech2.id
        )
        assert req.status == LifecycleState.ASSIGNED
        assert req.assigned_technician == tech2

    def test_assignment_audit_written(self, staff_user, tech_user, awaiting_assignment_request):
        AssignmentService.assign(
            request_id=awaiting_assignment_request.id,
            actor=staff_user,
            technician_id=tech_user.id
        )
        assert AuditLogEntry.objects.filter(action="request.assigned", resource_id=str(awaiting_assignment_request.id)).exists() == True
        assert StateHistory.objects.filter(request=awaiting_assignment_request, to_state=LifecycleState.ASSIGNED).exists()

    from unittest.mock import patch

    @patch('apps.websocket.services.event_bridge.WebSocketEventPublisher.publish')
    def test_assignment_event_emitted(self, mock_publish, staff_user, tech_user, awaiting_assignment_request):
        AssignmentService.assign(
            request_id=awaiting_assignment_request.id,
            actor=staff_user,
            technician_id=tech_user.id
        )
        
        # Verify bridge was called indicating event was dispatched
        assert mock_publish.called
