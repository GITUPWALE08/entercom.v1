import pytest
from django.contrib.auth import get_user_model
from django.core.cache import cache
from apps.roles.models import RoleDefinition, PermissionDefinition, RolePermission, UserRole, RoleChangeRequest, ApprovalRequestStatus
from apps.roles.services.permission_evaluator import has_permission, invalidate_cache
from apps.roles.services.role_service import RoleService

User = get_user_model()

@pytest.fixture
def user():
    return User.objects.create(email="test@example.com", first_name="Test")

@pytest.fixture
def superuser():
    return User.objects.create(email="admin@example.com", is_superuser=True)

@pytest.fixture
def role_with_perm():
    role = RoleDefinition.objects.create(name="Staff", slug="staff", hierarchy_level=60)
    perm = PermissionDefinition.objects.create(codename="request.view", name="View Request")
    RolePermission.objects.create(role=role, permission=perm)
    return role, perm

@pytest.mark.django_db
class TestPermissionEvaluator:
    def test_superuser_needs_role_for_perms(self, superuser):
        # Django superuser no longer has an automatic bypass
        assert has_permission(superuser, "any.perm") is False

    def test_user_without_role_has_no_perms(self, user):
        assert has_permission(user, "request.view") is False

    def test_user_with_role_has_perm(self, user, role_with_perm):
        role, perm = role_with_perm
        UserRole.objects.create(user=user, role=role)
        
        # Test DB load
        assert has_permission(user, "request.view") is True
        
        # Test Cache load (should be True)
        assert has_permission(user, "request.view") is True

    def test_cache_invalidation(self, user, role_with_perm):
        role, perm = role_with_perm
        UserRole.objects.create(user=user, role=role)
        
        assert has_permission(user, "request.view") is True
        
        # Deactivate role
        UserRole.objects.filter(user=user, role=role).update(is_active=False)
        invalidate_cache(user.id)
        
        assert has_permission(user, "request.view") is False

from django.utils import timezone
from datetime import timedelta

@pytest.mark.django_db
class TestDualControlApproval:
    def test_approve_role_change_unauthorized(self, user, role_with_perm):
        role, _ = role_with_perm
        request = RoleChangeRequest.objects.create(
            initiator=user,
            target_user=user, 
            requested_role=role,
            status=ApprovalRequestStatus.PENDING,
            expires_at=timezone.now() + timedelta(hours=48),
            reason="Test approval"
        )
        
        unauthorized_approver = User.objects.create(email="unauth@example.com")
        
        from core.exceptions import PermissionDeniedError
        # The unauthorized approver might fail either the hierarchy check OR the permission check.
        # Both are valid security rejections.
        with pytest.raises(PermissionDeniedError, match=r"(users.assign_roles or be a Super Admin|hierarchy level)"):
            RoleService.approve_role_change(request, unauthorized_approver)

    def test_approve_role_change_by_super_admin(self, user, role_with_perm):
        role, _ = role_with_perm
        superadmin_role = RoleDefinition.objects.create(
            name="Super Admin", slug="superadmin", hierarchy_level=100
        )
        approver = User.objects.create(email="approver@example.com")
        UserRole.objects.create(user=approver, role=superadmin_role)

        request = RoleChangeRequest.objects.create(
            initiator=user,
            target_user=user,
            requested_role=role,
            status=ApprovalRequestStatus.PENDING,
            expires_at=timezone.now() + timedelta(hours=48),
            reason="Test approval",
        )

        assert not UserRole.objects.filter(user=user, role=role).exists()

        RoleService.approve_role_change(request, approver)

        assert request.status == ApprovalRequestStatus.APPROVED
        assert UserRole.objects.filter(user=user, role=role).exists()
        assert has_permission(user, "request.view") is True

    def test_approve_role_change_with_assign_roles_permission(self, user, role_with_perm):
        role, perm = role_with_perm
        assign_perm = PermissionDefinition.objects.create(
            codename="users.assign_roles", name="Assign Roles"
        )
        approver_role = RoleDefinition.objects.create(
            name="HR", slug="hr", hierarchy_level=70
        )
        RolePermission.objects.create(role=approver_role, permission=assign_perm)
        approver = User.objects.create(email="hr@example.com")
        UserRole.objects.create(user=approver, role=approver_role)

        request = RoleChangeRequest.objects.create(
            initiator=user,
            target_user=user,
            requested_role=role,
            status=ApprovalRequestStatus.PENDING,
            expires_at=timezone.now() + timedelta(hours=48),
            reason="HR approval",
        )

        RoleService.approve_role_change(request, approver)
        assert request.status == ApprovalRequestStatus.APPROVED

    def test_approve_expired_role_change_rejected(self, user, role_with_perm):
        role, _ = role_with_perm
        superadmin_role = RoleDefinition.objects.create(
            name="Super Admin", slug="superadmin", hierarchy_level=100
        )
        approver = User.objects.create(email="sa-approve@example.com")
        UserRole.objects.create(user=approver, role=superadmin_role)

        request = RoleChangeRequest.objects.create(
            initiator=user,
            target_user=user,
            requested_role=role,
            status=ApprovalRequestStatus.PENDING,
            expires_at=timezone.now() - timedelta(hours=1),
            reason="Expired",
        )

        from core.exceptions import PermissionDeniedError

        with pytest.raises(PermissionDeniedError, match="expired"):
            RoleService.approve_role_change(request, approver)

    def test_initiator_cannot_approve_own_request(self, user, role_with_perm):
        role, _ = role_with_perm
        request = RoleChangeRequest.objects.create(
            initiator=user,
            target_user=user,
            requested_role=role,
            status=ApprovalRequestStatus.PENDING,
            expires_at=timezone.now() + timedelta(hours=48),
            reason="dual control",
        )

        from core.exceptions import PermissionDeniedError

        with pytest.raises(PermissionDeniedError, match="dual-control"):
            RoleService.approve_role_change(request, user)

@pytest.mark.django_db
class TestExpiredRoles:
    def test_expired_role_is_ignored(self, user, role_with_perm):
        role, perm = role_with_perm
        
        # Create an expired role
        UserRole.objects.create(
            user=user, 
            role=role, 
            is_active=True, 
            expires_at=timezone.now() - timedelta(hours=1)
        )
        
        # Cache hasn't been populated yet
        assert has_permission(user, "request.view") is False


@pytest.mark.django_db
class TestObjectPermissionOwnership:
    def test_ownership_does_not_bypass_missing_global_permission(self, user, role_with_perm):
        role, _ = role_with_perm
        UserRole.objects.create(user=user, role=role)

        class Owned:
            customer = user

        from apps.roles.services.permission_evaluator import has_object_permission

        assert has_object_permission(user, "request.delete", Owned()) is False

    def test_global_permission_required_before_ownership(self, user, role_with_perm):
        role, _ = role_with_perm
        UserRole.objects.create(user=user, role=role)

        class Owned:
            customer = user

        from apps.roles.services.permission_evaluator import has_object_permission

        assert has_object_permission(user, "request.view", Owned()) is True
