import pytest
from django.contrib.auth import get_user_model
from apps.requests.models import Request, LifecycleState, Verification, VerificationStatus, Evidence
from apps.requests.services.verification_service import VerificationService

User = get_user_model()

@pytest.fixture
def customer_user(db):
    return User.objects.create(email="customer@test.com", role="customer")

@pytest.fixture
def tech_user(db):
    return User.objects.create(email="tech@test.com", role="technician")

@pytest.fixture
def staff_user(db):
    return User.objects.create(email="staff@test.com", role="staff")

@pytest.fixture
def manager_user(db):
    return User.objects.create(email="manager@test.com", role="manager")

@pytest.fixture
def in_progress_request(customer_user, tech_user):
    req = Request.objects.create(
        public_id="REQ-TEST-VERIFY",
        customer=customer_user,
        assigned_technician=tech_user,
        category="installation",
        status=LifecycleState.IN_PROGRESS,
        description="Test verify"
    )
    return req

@pytest.mark.django_db(transaction=True)
class TestVerificationService:

    def test_verification_submit(self, tech_user, in_progress_request):
        verification = VerificationService.submit(
            request_id=in_progress_request.id,
            actor=tech_user,
            evidence={
                "photos": ["http://test.com/photo1.jpg"],
                "metadata": {"lat": 12.34, "lng": 56.78}
            }
        )
        assert verification.status == VerificationStatus.PENDING
        assert Evidence.objects.filter(verification=verification).count() == 1
        
        in_progress_request.refresh_from_db()
        assert in_progress_request.status == LifecycleState.PENDING_VERIFICATION

    def test_verification_reject(self, tech_user, staff_user, in_progress_request):
        VerificationService.submit(
            request_id=in_progress_request.id,
            actor=tech_user,
            evidence={"photos": ["http://test.com/photo1.jpg"]}
        )
        VerificationService.verify(
            request_id=in_progress_request.id,
            actor=staff_user,
            action_type="reject",
            notes="Blurry photo"
        )
        
        in_progress_request.refresh_from_db()
        assert in_progress_request.status == LifecycleState.IN_PROGRESS
        verification = Verification.objects.filter(request=in_progress_request).latest("created_at")
        assert verification.status == VerificationStatus.REJECTED

    def test_verification_approve(self, tech_user, staff_user, in_progress_request):
        VerificationService.submit(
            request_id=in_progress_request.id,
            actor=tech_user,
            evidence={"photos": ["http://test.com/photo1.jpg"]}
        )
        VerificationService.verify(
            request_id=in_progress_request.id,
            actor=staff_user,
            action_type="approve"
        )
        
        in_progress_request.refresh_from_db()
        assert in_progress_request.status == LifecycleState.COMPLETED
        verification = Verification.objects.filter(request=in_progress_request).latest("created_at")
        assert verification.status == VerificationStatus.APPROVED

    def test_verification_override(self, tech_user, manager_user, in_progress_request):
        VerificationService.submit(
            request_id=in_progress_request.id,
            actor=tech_user,
            evidence={"photos": ["http://test.com/photo1.jpg"]}
        )
        VerificationService.verify(
            request_id=in_progress_request.id,
            actor=manager_user,
            action_type="override",
            notes="Customer verbally confirmed"
        )
        
        in_progress_request.refresh_from_db()
        assert in_progress_request.status == LifecycleState.COMPLETED
        verification = Verification.objects.filter(request=in_progress_request).latest("created_at")
        assert verification.status == VerificationStatus.OVERRIDDEN
        assert verification.override_reason == "Customer verbally confirmed"
