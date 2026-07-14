import pytest
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient
from django.contrib.auth import get_user_model
from django.utils import timezone
from datetime import timedelta
from apps.requests.models import Request, LifecycleState, Assignment, Quote, Verification
from apps.requests.domain.actions import RequestAction

User = get_user_model()

@pytest.fixture
def api_client():
    return APIClient()

@pytest.fixture
def customer_user():
    user = User.objects.create(email="customer@test.com", role="CUSTOMER")
    # Assign permissions manually or assume role matrix is active via RBACChecker
    return user

@pytest.fixture
def staff_user():
    return User.objects.create(email="staff@test.com", role="STAFF")

@pytest.fixture
def tech_user():
    return User.objects.create(email="tech@test.com", role="TECHNICIAN")

@pytest.fixture
def manager_user():
    return User.objects.create(email="manager@test.com", role="MANAGER")

@pytest.fixture
def draft_request(customer_user):
    return Request.objects.create(
        public_id="REQ-TEST1",
        customer=customer_user,
        category="installation",
        status=LifecycleState.DRAFT,
        description="Draft request",
        location={"lat": 1.0, "lng": 2.0}
    )

@pytest.fixture
def submitted_request(customer_user):
    return Request.objects.create(
        public_id="REQ-TEST2",
        customer=customer_user,
        category="installation",
        status=LifecycleState.SUBMITTED,
        description="Submitted request",
        location={"lat": 1.0, "lng": 2.0}
    )

@pytest.fixture
def assigned_request(customer_user, tech_user):
    req = Request.objects.create(
        public_id="REQ-TEST3",
        customer=customer_user,
        assigned_technician=tech_user,
        category="installation",
        status=LifecycleState.ASSIGNED,
        description="Assigned request",
        location={"lat": 1.0, "lng": 2.0}
    )
    Assignment.objects.create(request=req, technician=tech_user)
    return req

@pytest.mark.django_db(transaction=True)
class TestRequestAPIEndpoints:

    def test_create_request_success(self, api_client, customer_user):
        api_client.force_authenticate(user=customer_user)
        payload = {"category": "installation", "description": "Install", "location": {"lat": 1.0, "lng": 2.0}}
        
        response = api_client.post(reverse('request-list'), payload, format='json')
        
        assert response.status_code == status.HTTP_201_CREATED
        assert response.data['success'] is True
        assert Request.objects.count() == 1
        req = Request.objects.first()
        assert req.status == LifecycleState.DRAFT

    def test_create_request_validation_error(self, api_client, customer_user):
        api_client.force_authenticate(user=customer_user)
        payload = {"category": "installation"} # Missing fields
        response = api_client.post(reverse('request-list'), payload, format='json')
        
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert response.data['success'] is False

    def test_submit_request_success(self, api_client, customer_user, draft_request):
        api_client.force_authenticate(user=customer_user)
        response = api_client.post(reverse('request-submit', kwargs={'pk': draft_request.id}), format='json')
        
        assert response.status_code == status.HTTP_200_OK
        draft_request.refresh_from_db()
        assert draft_request.status == LifecycleState.SUBMITTED

    def test_assign_technician_success(self, api_client, staff_user, submitted_request, tech_user):
        submitted_request.status = LifecycleState.AWAITING_ASSIGNMENT
        submitted_request.save()
        api_client.force_authenticate(user=staff_user)
        payload = {"technician_id": tech_user.id}
        response = api_client.post(reverse('request-assign', kwargs={'pk': submitted_request.id}), payload, format='json')
        
        assert response.status_code == status.HTTP_200_OK
        submitted_request.refresh_from_db()
        assert submitted_request.status == LifecycleState.ASSIGNED
        assert submitted_request.assigned_technician == tech_user

    def test_assign_technician_permission_denied(self, api_client, customer_user, submitted_request, tech_user):
        submitted_request.status = LifecycleState.AWAITING_ASSIGNMENT
        submitted_request.save()
        api_client.force_authenticate(user=customer_user)
        payload = {"technician_id": tech_user.id}
        response = api_client.post(reverse('request-assign', kwargs={'pk': submitted_request.id}), payload, format='json')
        
        assert response.status_code in [status.HTTP_403_FORBIDDEN, status.HTTP_404_NOT_FOUND]

    def test_accept_assignment_success(self, api_client, tech_user, assigned_request):
        api_client.force_authenticate(user=tech_user)
        response = api_client.post(reverse('request-accept', kwargs={'pk': assigned_request.id}), format='json')
        
        assert response.status_code == status.HTTP_200_OK
        assigned_request.refresh_from_db()
        assert assigned_request.status == LifecycleState.IN_PROGRESS

    def test_decline_assignment_success(self, api_client, tech_user, assigned_request):
        api_client.force_authenticate(user=tech_user)
        response = api_client.post(reverse('request-decline', kwargs={'pk': assigned_request.id}), {"reason_code": "busy"}, format='json')
        
        assert response.status_code == status.HTTP_200_OK
        assigned_request.refresh_from_db()
        assert assigned_request.status == LifecycleState.AWAITING_ASSIGNMENT
        assert assigned_request.assigned_technician is None

    def test_cancel_request_success(self, api_client, customer_user, draft_request):
        api_client.force_authenticate(user=customer_user)
        response = api_client.post(reverse('request-cancel', kwargs={'pk': draft_request.id}), {"reason_code": "changed_mind"}, format='json')
        
        assert response.status_code == status.HTTP_200_OK
        draft_request.refresh_from_db()
        assert draft_request.status == LifecycleState.CANCELLED

    def test_escalate_request_success(self, api_client, manager_user, submitted_request):
        api_client.force_authenticate(user=manager_user)
        response = api_client.post(reverse('request-escalate', kwargs={'pk': submitted_request.id}), {"reason": "MANUAL"}, format='json')
        
        assert response.status_code == status.HTTP_200_OK
        submitted_request.refresh_from_db()
        assert submitted_request.status == LifecycleState.ESCALATED

    def test_create_quote_success(self, api_client, tech_user, assigned_request):
        # Move to AWAITING_QUOTE so quote can be issued
        assigned_request.status = LifecycleState.AWAITING_QUOTE
        assigned_request.save()
        
        api_client.force_authenticate(user=tech_user)
        response = api_client.post(reverse('request-quotes', kwargs={'request_pk': assigned_request.id}), {"amount": "100.50"}, format='json')
        
        assert response.status_code == status.HTTP_201_CREATED
        assigned_request.refresh_from_db()
        assert assigned_request.status == LifecycleState.AWAITING_CUSTOMER_APPROVAL
        assert Quote.objects.filter(request=assigned_request).count() == 1

    def test_approve_quote_success(self, api_client, customer_user, tech_user, assigned_request):
        assigned_request.status = LifecycleState.AWAITING_CUSTOMER_APPROVAL
        assigned_request.save()
        quote = Quote.objects.create(request=assigned_request, version=1, amount=100.0, status="issued", expires_at=timezone.now() + timedelta(days=30), created_by=tech_user)
        
        api_client.force_authenticate(user=customer_user)
        response = api_client.post(reverse('request-quote-approve', kwargs={'request_pk': assigned_request.id}), format='json')
        
        assert response.status_code == status.HTTP_200_OK
        assigned_request.refresh_from_db()
        assert assigned_request.status == LifecycleState.AWAITING_PAYMENT # Based on transition context default
        quote.refresh_from_db()
        assert quote.status == "approved"

    def test_revise_quote_success(self, api_client, customer_user, tech_user, assigned_request):
        assigned_request.status = LifecycleState.AWAITING_CUSTOMER_APPROVAL
        assigned_request.save()
        quote = Quote.objects.create(request=assigned_request, version=1, amount=100.0, status="issued", expires_at=timezone.now() + timedelta(days=30), created_by=tech_user)
        
        api_client.force_authenticate(user=customer_user)
        response = api_client.post(reverse('request-quote-revise', kwargs={'request_pk': assigned_request.id}), format='json')
        
        assert response.status_code == status.HTTP_200_OK
        assigned_request.refresh_from_db()
        assert assigned_request.status == LifecycleState.AWAITING_QUOTE
        quote.refresh_from_db()
        assert quote.status == "issued"

    def test_reject_quote_success(self, api_client, customer_user, tech_user, assigned_request):
        assigned_request.status = LifecycleState.AWAITING_CUSTOMER_APPROVAL
        assigned_request.save()
        quote = Quote.objects.create(request=assigned_request, version=1, amount=100.0, status="issued", expires_at=timezone.now() + timedelta(days=30), created_by=tech_user)

        api_client.force_authenticate(user=customer_user)
        response = api_client.post(reverse('request-quote-reject', kwargs={'request_pk': assigned_request.id}), format='json')

        assert response.status_code == status.HTTP_200_OK
        assigned_request.refresh_from_db()
        assert assigned_request.status == LifecycleState.AWAITING_QUOTE
        quote.refresh_from_db()
        assert quote.status == "rejected"

    def test_quote_customer_action_success(self, api_client, customer_user, tech_user, assigned_request):
        assigned_request.status = LifecycleState.AWAITING_CUSTOMER_APPROVAL
        assigned_request.save()
        quote = Quote.objects.create(request=assigned_request, version=1, amount=100.0, status="issued", expires_at=timezone.now() + timedelta(days=30), created_by=tech_user)
        
        api_client.force_authenticate(user=customer_user)
        payload = {"action": "revise", "reason": "Too expensive"}
        response = api_client.post(reverse('request-quote-customer-action', kwargs={'request_pk': assigned_request.id}), payload, format='json')
        
        assert response.status_code == status.HTTP_200_OK
        assert response.data['success'] is True
        quote.refresh_from_db()
        assert quote.status == "issued"

    def test_verification_submit_success(self, api_client, tech_user, assigned_request):
        assigned_request.status = LifecycleState.IN_PROGRESS
        assigned_request.save()
        
        api_client.force_authenticate(user=tech_user)
        payload = {
            "photos": ["https://img.com/1"],
            "checklist": {"power": True},
            "customer_ack": True,
            "metadata": {"lat": 1.0, "lng": 2.0}
        }
        response = api_client.post(reverse('request-verify-submit', kwargs={'request_pk': assigned_request.id}), payload, format='json')
        
        assert response.status_code == status.HTTP_200_OK
        assigned_request.refresh_from_db()
        assert assigned_request.status == LifecycleState.PENDING_VERIFICATION
        assert Verification.objects.filter(request=assigned_request).count() == 1

    def test_verification_review_success(self, api_client, staff_user, assigned_request):
        assigned_request.status = LifecycleState.PENDING_VERIFICATION
        assigned_request.save()
        verification = Verification.objects.create(request=assigned_request, status="pending")
        
        api_client.force_authenticate(user=staff_user)
        payload = {"action": "approve"}
        response = api_client.post(reverse('request-verify-review', kwargs={'request_pk': assigned_request.id}), payload, format='json')
        
        assert response.status_code == status.HTTP_200_OK
        assigned_request.refresh_from_db()
        assert assigned_request.status == LifecycleState.COMPLETED
        verification.refresh_from_db()
        assert verification.status == "approved"

    def test_partial_update_success(self, api_client, tech_user, assigned_request):
        # Technician has request.update permissions per matrix
        api_client.force_authenticate(user=tech_user)
        response = api_client.patch(reverse('request-detail', kwargs={'pk': assigned_request.id}), {"description": "updated desc"}, format='json')
        
        assert response.status_code == status.HTTP_200_OK
        assigned_request.refresh_from_db()
        assert assigned_request.description == "updated desc"

    def test_timeline_success(self, api_client, staff_user, draft_request):
        api_client.force_authenticate(user=staff_user)
        response = api_client.get(reverse('request-timeline', kwargs={'pk': draft_request.id}))
        assert response.status_code == status.HTTP_200_OK
        assert 'data' in response.data
