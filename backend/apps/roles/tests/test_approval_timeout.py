import pytest
from django.utils import timezone
from datetime import timedelta
from django.contrib.auth import get_user_model
from apps.roles.models import RoleChangeRequest, ApprovalRequestStatus, RoleDefinition
from apps.roles.management.commands.cleanup_expired_roles import Command
from apps.audit_logs.models import AuditLogEntry

User = get_user_model()

@pytest.fixture
def user():
    return User.objects.create(email="user4@example.com")

@pytest.fixture
def admin_user():
    return User.objects.create(email="admin4@example.com")

@pytest.mark.django_db
def test_approval_timeout_logging(user, admin_user):
    role = RoleDefinition.objects.create(name="Manager", slug="manager", description="mgr")
    
    # Create an expired role change request
    req = RoleChangeRequest.objects.create(
        initiator=admin_user,
        target_user=user,
        requested_role=role,
        status=ApprovalRequestStatus.PENDING,
        expires_at=timezone.now() - timedelta(days=1),
        reason="Needs approval"
    )
    
    # Run the cleanup command
    cmd = Command()
    cmd.handle()
    
    # Verify the request was expired
    req.refresh_from_db()
    assert req.status == ApprovalRequestStatus.EXPIRED
    
    # Verify audit log was created with correct action and metadata
    log_entry = AuditLogEntry.objects.filter(action="roles.approval_timeout").first()
    assert log_entry is not None
    assert log_entry.metadata["role"] == "manager"
    assert "duration" in log_entry.metadata


# Role change → existing refresh tokens revoked
@pytest.mark.django_db
def test_role_change_revoke_token(user, admin_user):
    role = RoleDefinition.objects.create(name="Manager", slug="manager", description="mgr")

    # Create an expired role change request
    req = RoleChangeRequest.objects.create(
        initiator=admin_user,
        target_user=user,
        requested_role=role,
        status=ApprovalRequestStatus.PENDING,
        expires_at=timezone.now() + timedelta(days=1),
        reason="Needs approval"
    )