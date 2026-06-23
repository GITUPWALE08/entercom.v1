import pytest
from django.contrib.auth import get_user_model
from django.utils import timezone
from datetime import timedelta
from apps.roles.models import RoleDefinition, UserRole, PermissionDefinition, RolePermission, RoleChangeRequest, ApprovalRequestStatus
from apps.roles.services.permission_evaluator import has_permission, has_object_permission
from apps.roles.services.role_service import RoleService
from core.exceptions import PermissionDeniedError

User = get_user_model()

@pytest.fixture
def superadmin_role():
    return RoleDefinition.objects.create(name="Super Admin", slug="superadmin", hierarchy_level=100)

@pytest.fixture
def manager_role():
    return RoleDefinition.objects.create(name="Manager", slug="manager", hierarchy_level=80)

@pytest.fixture
def staff_role():
    return RoleDefinition.objects.create(name="Staff", slug="staff", hierarchy_level=60)

@pytest.fixture
def view_perm():
    return PermissionDefinition.objects.create(codename="request.view", name="View Request")

@pytest.mark.django_db
class TestSecurityRemediation:
    def test_superuser_bypass_prevention(self, view_perm):
        # Django superuser should NOT have RBAC permissions without an assigned role
        user = User.objects.create(email="superuser@example.com", is_superuser=True)
        assert has_permission(user, "request.view") is False

    def test_object_permission_hierarchy_enforcement(self, manager_role, staff_role, view_perm):
        # Ownership should NOT override hierarchy
        manager1 = User.objects.create(email="mgr1@example.com")
        UserRole.objects.create(user=manager1, role=manager_role)
        
        manager2 = User.objects.create(email="mgr2@example.com")
        UserRole.objects.create(user=manager2, role=manager_role)
        
        # Give manager1 the global permission
        RolePermission.objects.create(role=manager_role, permission=view_perm)
        
        class MockObj:
            id = 1
            created_by = manager2 # Manager 2 "owns" this resource
        
        # Manager 1 has the global permission, but Manager 2 is equal rank
        # so Manager 1 should NOT have object permission if it belongs to Manager 2
        # (Assuming the logic we implemented in has_object_permission)
        assert has_object_permission(manager1, "request.view", manager2) is False

    def test_equal_rank_deactivation_rejection(self, manager_role):
        manager1 = User.objects.create(email="mgr1@example.com")
        UserRole.objects.create(user=manager1, role=manager_role)
        
        manager2 = User.objects.create(email="mgr2@example.com")
        UserRole.objects.create(user=manager2, role=manager_role)
        
        with pytest.raises(PermissionDeniedError, match="cannot deactivate a role higher than or equal to their own"):
            RoleService.deactivate_role(user=manager2, role_slug="manager", deactivated_by=manager1)

    def test_unauthorized_approval_rejection(self, manager_role, staff_role):
        staff = User.objects.create(email="staff@example.com")
        UserRole.objects.create(user=staff, role=staff_role)
        
        target = User.objects.create(email="target@example.com")
        
        request = RoleChangeRequest.objects.create(
            initiator=staff,
            target_user=target,
            requested_role=manager_role,
            status=ApprovalRequestStatus.PENDING,
            expires_at=timezone.now() + timedelta(hours=48),
            reason="Test"
        )
        
        # Another staff (equal/lower rank) cannot approve
        staff2 = User.objects.create(email="staff2@example.com")
        UserRole.objects.create(user=staff2, role=staff_role)
        
        with pytest.raises(PermissionDeniedError, match=r"(Approver must hold users.assign_roles or be a Super Admin|hierarchy level)"):
            RoleService.approve_role_change(request, staff2)

    def test_expired_role_denial(self, staff_role, view_perm):
        user = User.objects.create(email="expired@example.com")
        UserRole.objects.create(
            user=user, 
            role=staff_role, 
            is_active=True, 
            expires_at=timezone.now() - timedelta(hours=1)
        )
        RolePermission.objects.create(role=staff_role, permission=view_perm)
        
        assert has_permission(user, "request.view") is False

    def test_last_superadmin_protection_atomic(self, superadmin_role):
        sa = User.objects.create(email="last_sa@example.com")
        UserRole.objects.create(user=sa, role=superadmin_role)
        
        with pytest.raises(PermissionDeniedError, match="Cannot deactivate the last remaining Super Admin"):
            RoleService.deactivate_role(user=sa, role_slug="superadmin", deactivated_by=None)
