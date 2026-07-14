import pytest
from django.contrib.auth import get_user_model
from django.core.exceptions import PermissionDenied
from apps.requests.models import Request, LifecycleState, Quote
from apps.requests.services.assignment_service import AssignmentService
from apps.requests.services.quote_service import QuoteService
from apps.requests.services.verification_service import VerificationService
from apps.requests.services.escalation_service import EscalationService
from apps.requests.domain.exceptions import PermissionDeniedTransitionError

User = get_user_model()

@pytest.fixture
def customer_a(db):
    return User.objects.create(email="customer_a@test.com", role="CUSTOMER")

@pytest.fixture
def customer_b(db):
    return User.objects.create(email="customer_b@test.com", role="CUSTOMER")

@pytest.fixture
def tech_assigned(db):
    return User.objects.create(email="tech_assigned@test.com", role="TECHNICIAN")

@pytest.fixture
def tech_unassigned(db):
    return User.objects.create(email="tech_unassigned@test.com", role="TECHNICIAN")

@pytest.fixture
def staff_user(db):
    return User.objects.create(email="staff_auth@test.com", role="STAFF")

@pytest.fixture
def manager_user(db):
    return User.objects.create(email="manager_auth@test.com", role="MANAGER")

@pytest.fixture
def base_request(customer_a, tech_assigned):
    return Request.objects.create(
        public_id="REQ-AUTH-TEST",
        customer=customer_a,
        assigned_technician=tech_assigned,
        category="installation",
        description="Auth Test Request"
    )

@pytest.mark.django_db(transaction=True)
class TestServiceLayerNegativeAuthorization:
    """
    Explicitly verifies that the Service Layer throws PermissionDenied
    when actors attempt actions outside their authorized scope.
    """

    # --- QuoteService Tests ---

    def test_customer_cannot_modify_other_customer_quote(self, customer_b, tech_assigned, base_request):
        base_request.status = LifecycleState.AWAITING_QUOTE
        base_request.save()
        QuoteService.create_quote(request_id=base_request.id, actor=tech_assigned, data={"amount": 100.0})
        
        # Move to approval phase
        base_request.status = LifecycleState.AWAITING_CUSTOMER_APPROVAL
        base_request.save()

        # Customer B attempts to approve Customer A's quote
        with pytest.raises(PermissionDenied, match="Missing.*permission|Unauthorized"):
            QuoteService.handle_customer_action(
                request_id=base_request.id, 
                actor=customer_b, 
                action_type="approve"
            )

    def test_customer_cannot_revise_other_customer_quote(self, customer_b, tech_assigned, base_request):
        base_request.status = LifecycleState.AWAITING_QUOTE
        base_request.save()
        QuoteService.create_quote(request_id=base_request.id, actor=tech_assigned, data={"amount": 100.0})
        
        base_request.status = LifecycleState.AWAITING_CUSTOMER_APPROVAL
        base_request.save()

        # Customer B attempts to revise Customer A's quote
        with pytest.raises(PermissionDenied, match="Missing.*permission|Unauthorized"):
            QuoteService.handle_customer_action(
                request_id=base_request.id, 
                actor=customer_b, 
                action_type="revise",
                reason="Too expensive"
            )

    def test_unassigned_tech_cannot_create_quote(self, tech_unassigned, base_request):
        base_request.status = LifecycleState.AWAITING_QUOTE
        base_request.save()

        # Tech not assigned to the request attempts to create a quote
        with pytest.raises(PermissionDenied, match="Missing.*permission|Unauthorized"):
            QuoteService.create_quote(
                request_id=base_request.id, 
                actor=tech_unassigned, 
                data={"amount": 150.0}
            )

    # --- VerificationService Tests ---

    def test_technician_cannot_submit_verification_for_other_assignment(self, tech_unassigned, base_request):
        base_request.status = LifecycleState.IN_PROGRESS
        base_request.save()

        # Tech not assigned attempts to submit verification
        with pytest.raises(PermissionDenied, match="Missing.*permission|Unauthorized"):
            VerificationService.submit(
                request_id=base_request.id,
                actor=tech_unassigned,
                evidence={"photos": ["http://test.com/photo.jpg"]}
            )

    def test_customer_cannot_verify_work(self, customer_a, base_request):
        base_request.status = LifecycleState.PENDING_VERIFICATION
        base_request.save()

        # Customer attempts to perform staff verification
        with pytest.raises(PermissionDenied, match="Missing.*permission|Unauthorized"):
            VerificationService.verify(
                request_id=base_request.id,
                actor=customer_a,
                action_type="approve"
            )

    # --- EscalationService Tests ---

    def test_escalation_resolution_scope_enforced(self, tech_assigned, base_request):
        base_request.status = LifecycleState.ESCALATED
        base_request.save()

        # Technician attempts to resolve an escalation (Manager role required)
        with pytest.raises(PermissionDenied, match="Missing.*permission|Unauthorized"):
            EscalationService.resolve(
                request_id=base_request.id,
                actor=tech_assigned,
                target_state=LifecycleState.AWAITING_ASSIGNMENT,
                resolution_type="Reassigned"
            )

    # --- AssignmentService Tests ---

    def test_assignment_decline_scope_enforced(self, tech_unassigned, base_request):
        base_request.status = LifecycleState.ASSIGNED
        base_request.save()

        # Unassigned technician attempts to decline an assignment belonging to tech_assigned
        with pytest.raises(PermissionDenied, match="Missing.*permission|Unauthorized"):
            AssignmentService.decline(
                request_id=base_request.id,
                actor=tech_unassigned,
                reason_code="too far"
            )

    def test_customer_cannot_assign_technician(self, customer_a, tech_assigned, base_request):
        base_request.status = LifecycleState.AWAITING_ASSIGNMENT
        base_request.save()

        # Customer attempts to perform staff routing action
        with pytest.raises(PermissionDenied, match="Missing.*permission|Unauthorized"):
            AssignmentService.assign(
                request_id=base_request.id,
                actor=customer_a,
                technician_id=tech_assigned.id
            )

    def test_technician_cannot_approve_quote(self, tech_assigned, base_request):
        base_request.status = LifecycleState.AWAITING_QUOTE
        base_request.save()
        QuoteService.create_quote(request_id=base_request.id, actor=tech_assigned, data={"amount": 100.0})
        
        base_request.status = LifecycleState.AWAITING_CUSTOMER_APPROVAL
        base_request.save()

        # Technician attempts to approve the quote they just created
        with pytest.raises(PermissionDenied, match="Missing.*permission|Unauthorized"):
            QuoteService.handle_customer_action(
                request_id=base_request.id, 
                actor=tech_assigned, 
                action_type="approve"
            )

    def test_customer_cannot_submit_verification_evidence(self, customer_a, base_request):
        base_request.status = LifecycleState.IN_PROGRESS
        base_request.save()

        # Customer attempts to act as the technician and submit work evidence
        with pytest.raises(PermissionDenied, match="Missing.*permission|Unauthorized"):
            VerificationService.submit(
                request_id=base_request.id,
                actor=customer_a,
                evidence={"photos": ["http://test.com/fake_work.jpg"]}
            )

    def test_customer_cannot_escalate_request(self, customer_a, base_request):
        base_request.status = LifecycleState.SUBMITTED
        base_request.save()

        # Customer attempts to trigger a manual manager escalation
        with pytest.raises(PermissionDeniedTransitionError, match="Missing.*permission|Unauthorized"):
            EscalationService.process_escalation(
                request_id=base_request.id,
                trigger_type="MANUAL",
                actor=customer_a
            )

    def test_staff_cannot_accept_assignment(self, staff_user, tech_assigned, base_request):
        # Staff assigns the request to the tech
        base_request.status = LifecycleState.AWAITING_ASSIGNMENT
        base_request.save()
        AssignmentService.assign(
            request_id=base_request.id,
            actor=staff_user,
            technician_id=tech_assigned.id
        )

        # Staff attempts to accept the assignment on behalf of the technician
        with pytest.raises(PermissionDenied, match="Missing.*permission|Unauthorized"):
            AssignmentService.accept(
                request_id=base_request.id,
                actor=staff_user
            )

    def test_unassigned_tech_cannot_update_request_description(self, tech_unassigned, base_request):
        base_request.status = LifecycleState.IN_PROGRESS
        base_request.save()

        from apps.requests.services.request_service import RequestService
        # Tech not assigned attempts to update the request metadata
        with pytest.raises(PermissionDenied, match="Missing.*permission|Unauthorized"):
            RequestService.update_request(
                request_id=base_request.id,
                user=tech_unassigned,
                data={"description": "Hacked description"}
            )

