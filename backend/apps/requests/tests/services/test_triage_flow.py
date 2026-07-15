import pytest
from unittest.mock import patch
from django.contrib.auth import get_user_model
from apps.requests.models import Request, LifecycleState
from apps.requests.domain.actions import RequestAction
from apps.requests.services.request_service import RequestService
from apps.requests.domain.exceptions import GuardConditionFailedError, PermissionDeniedTransitionError

User = get_user_model()


@pytest.fixture
def staff_user(db):
    return User.objects.create(email="staff@test.com", role="STAFF")

@pytest.fixture
def customer_user(db):
    return User.objects.create(email="cust@test.com", role="CUSTOMER")

@pytest.fixture
def draft_request(db, customer_user):
    return Request.objects.create(
        customer=customer_user,
        category="information",
        description="Test",
        status=LifecycleState.DRAFT
    )


@pytest.mark.django_db
class TestTriageFlowIntegration:
    """
    End-to-End integration test for the Staff Triage workflow.
    """

    def test_triage_close_direct_success(self, staff_user, customer_user):
        """Tests that an information request can be closed directly by staff."""
        req = Request.objects.create(
            customer=customer_user,
            category="information",
            status=LifecycleState.STAFF_REVIEW,
            description="Info req"
        )
        
        # Staff triages request to close directly
        updated_req = RequestService.triage(
            request_id=req.id,
            actor=staff_user,
            action=RequestAction.CLOSE_DIRECT
        )
        
        assert updated_req.status == LifecycleState.COMPLETED
        
    def test_triage_close_direct_fails_on_installation(self, staff_user, customer_user):
        """Tests that an installation request CANNOT be closed directly."""
        req = Request.objects.create(
            customer=customer_user,
            category="installation",
            status=LifecycleState.STAFF_REVIEW,
            description="Install req"
        )
        
        with pytest.raises(GuardConditionFailedError):
            RequestService.triage(
                request_id=req.id,
                actor=staff_user,
                action=RequestAction.CLOSE_DIRECT
            )

    def test_triage_needs_quote_success(self, staff_user, customer_user):
        """Tests that an installation request can be routed to awaiting_quote."""
        req = Request.objects.create(
            customer=customer_user,
            category="installation",
            status=LifecycleState.STAFF_REVIEW,
            description="Install req"
        )
        
        updated_req = RequestService.triage(
            request_id=req.id,
            actor=staff_user,
            action=RequestAction.NEEDS_QUOTE
        )
        
        assert updated_req.status == LifecycleState.AWAITING_QUOTE

    def test_triage_assign_directly_success(self, staff_user, customer_user):
        """Tests that warranty requests skip quote and payment and go to assignment."""
        req = Request.objects.create(
            customer=customer_user,
            category="warranty",
            status=LifecycleState.STAFF_REVIEW,
            description="Warranty req"
        )
        
        updated_req = RequestService.triage(
            request_id=req.id,
            actor=staff_user,
            action=RequestAction.ASSIGN_DIRECTLY
        )
        
        assert updated_req.status == LifecycleState.AWAITING_ASSIGNMENT
        
    def test_customer_cannot_triage(self, staff_user, customer_user):
        """Tests that RBAC prevents a customer from triaging a request."""
        req = Request.objects.create(
            customer=customer_user,
            category="information",
            status=LifecycleState.STAFF_REVIEW,
            description="Info req"
        )
        
        from django.core.exceptions import PermissionDenied
        with pytest.raises(PermissionDenied):
            RequestService.triage(
                request_id=req.id,
                actor=customer_user,
                action=RequestAction.CLOSE_DIRECT
            )
