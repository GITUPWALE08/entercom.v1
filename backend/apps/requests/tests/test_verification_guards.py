import pytest
from django.contrib.auth import get_user_model
from django.core.exceptions import ValidationError
from apps.requests.services.verification_service import VerificationService
from apps.requests.models import Request
from apps.requests.models.assignment import Assignment, AssignmentResponseStatus

User = get_user_model()

@pytest.mark.django_db
def test_verification_submit_requires_accepted_assignment():
    customer = User.objects.create_user(email="customer@test.com", password="pwd", first_name="C", last_name="C", role="CUSTOMER")
    technician = User.objects.create_user(email="tech@test.com", password="pwd", first_name="T", last_name="T", role="TECHNICIAN")
    
    request = Request.objects.create(customer=customer, status="in_progress")
    
    # Missing assignment completely
    with pytest.raises(ValidationError, match="You must accept the assignment before submitting verification"):
        VerificationService.submit(request.id, technician, {})
        
    # Pending assignment
    assignment = Assignment.objects.create(request=request, technician=technician, response_status=AssignmentResponseStatus.PENDING)
    with pytest.raises(ValidationError, match="You must accept the assignment before submitting verification"):
        VerificationService.submit(request.id, technician, {})
