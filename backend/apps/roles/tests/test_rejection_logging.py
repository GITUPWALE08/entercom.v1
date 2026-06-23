import pytest
from django.contrib.auth import get_user_model
from apps.roles.models import RoleChangeRequest, ApprovalRequestStatus, RoleDefinition, UserRole
from apps.roles.services.role_service import RoleService
from apps.audit_logs.models import AuditLogEntry
from django.utils import timezone
from datetime import timedelta

User = get_user_model()

@pytest.fixture
def rejection_target_user():
    return User.objects.create(email="user5@example.com")

@pytest.fixture
def rejection_admin_user():
    return User.objects.create(email="admin5@example.com")

@pytest.mark.django_db
def test_rejection_logging(rejection_target_user, rejection_admin_user):
    role = RoleDefinition.objects.get_or_create(name="Staff", slug="staff", defaults={"description": "staff"})[0]
    
    # Make admin_user a superadmin to allow rejection
    superadmin_role = RoleDefinition.objects.get_or_create(name="Superadmin", slug="superadmin", defaults={"description": "sa"})[0]
    UserRole.objects.create(user=rejection_admin_user, role=superadmin_role, is_active=True)

    req = RoleChangeRequest.objects.create(
        initiator=rejection_target_user,
        target_user=rejection_target_user,
        requested_role=role,
        status=ApprovalRequestStatus.PENDING,
        expires_at=timezone.now() + timedelta(days=1),
        reason="Needs staff role"
    )
    
    rejected_req = RoleService.reject_role_change(req, rejected_by=rejection_admin_user, reason="Not allowed")
    
    assert rejected_req.status == ApprovalRequestStatus.REJECTED
    
    log_entry = AuditLogEntry.objects.filter(action="roles.approval_rejected").first()
    assert log_entry is not None
    assert log_entry.reason == "Not allowed"
    assert log_entry.metadata["role_slug"] == "staff"
    assert log_entry.metadata["approver"] == str(rejection_admin_user.id)
    assert log_entry.metadata["target_user"] == str(rejection_target_user.id)
