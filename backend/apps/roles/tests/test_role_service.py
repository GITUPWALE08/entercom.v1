import uuid

import pytest
from django.contrib.auth import get_user_model
from apps.audit_logs.models import AuditLogEntry
from apps.roles.models import RoleDefinition, UserRole
from apps.roles.services.role_service import RoleService
from apps.authentication.models import UserSession


User = get_user_model()
jti = uuid.uuid4()
ip_address = "192.168.100.23"
last_activity = "2026-05-22 14:30:00"      # e.g., user last seen
created_at  = "2026-01-15 09:12:45"      # record created
expires_at  = "2026-12-31 23:59:59"       # e.g., token/session expiry

@pytest.fixture
def user():
    return User.objects.create(email="target@example.com", first_name="Target", last_name="User")

@pytest.fixture
def superadmin_role():
    return RoleDefinition.objects.create(name="Super Admin", slug="superadmin", hierarchy_level=100)

@pytest.fixture
def admin_user(superadmin_role):
    u = User.objects.create(email="admin@example.com", first_name="Admin", last_name="User")
    UserRole.objects.create(user=u, role=superadmin_role)
    return u

@pytest.mark.django_db
class TestRoleServiceAudit:
    def test_assign_role_logs_audit(self, user, admin_user):
        RoleDefinition.objects.create(name="Staff", slug="staff", hierarchy_level=60)
        
        RoleService.assign_role(
            user=user,
            role_slug="staff",
            assigned_by=admin_user,
            reason="New hire"
        )
        
        # Verify Audit Log
        entry = AuditLogEntry.objects.get(action="roles.assignment_created")
        assert entry.actor == admin_user
        assert entry.resource_type == "user"
        assert entry.resource_id == str(user.id)
        assert entry.reason == "New hire"
        assert entry.metadata["role_slug"] == "staff"

    def test_deactivate_role_logs_audit(self, user, admin_user):
        RoleDefinition.objects.create(name="Staff", slug="staff", hierarchy_level=60)
        RoleService.assign_role(user=user, role_slug="staff", assigned_by=admin_user)
        RoleService.deactivate_role(user=user, role_slug="staff", deactivated_by=admin_user)
        

        entry = AuditLogEntry.objects.get(action="roles.assignment_deactivated")
        
        assert entry.actor == admin_user
        assert entry.metadata["role_slug"] == "staff"
