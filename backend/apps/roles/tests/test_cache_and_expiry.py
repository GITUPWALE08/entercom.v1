import pytest
from django.core.cache import cache
from django.core.management import call_command
from django.utils import timezone
from datetime import timedelta

from apps.audit_logs.models import AuditLogEntry
from apps.roles.models import (
    ApprovalRequest,
    ApprovalRequestStatus,
    PermissionCacheVersion,
    PermissionDefinition,
    RoleChangeRequest,
    RoleDefinition,
    RolePermission,
    UserRole,
)
from apps.roles.services.permission_evaluator import (
    get_permission_cache_key,
    has_permission,
    invalidate_cache,
)
from apps.users.models import User


@pytest.mark.django_db
class TestPermissionCacheVersion:
    def test_invalidate_cache_atomically_increments_version(self):
        user = User.objects.create(email="cache@example.com")
        invalidate_cache(user.id)
        assert PermissionCacheVersion.objects.get(user=user).version == 1

        invalidate_cache(user.id)
        assert PermissionCacheVersion.objects.get(user=user).version == 2

        invalidate_cache(user.id)
        assert PermissionCacheVersion.objects.get(user=user).version == 3

    def test_role_change_invalidates_stale_cache(self):
        user = User.objects.create(email="stale@example.com")
        role = RoleDefinition.objects.create(name="Staff", slug="staff", hierarchy_level=60)
        perm = PermissionDefinition.objects.create(codename="request.view", name="View")
        RolePermission.objects.create(role=role, permission=perm)
        UserRole.objects.create(user=user, role=role)

        assert has_permission(user, "request.view") is True
        cache_key = get_permission_cache_key(user.id)
        assert cache.get(cache_key) is not None

        UserRole.objects.filter(user=user, role=role).update(is_active=False)
        invalidate_cache(user.id)

        assert has_permission(user, "request.view") is False


@pytest.mark.django_db
class TestApprovalExpiryWorkflow:
    def test_expired_role_change_request_marked_expired(self):
        initiator = User.objects.create(email="init@example.com")
        target = User.objects.create(email="tgt@example.com")
        role = RoleDefinition.objects.create(name="Staff", slug="staff", hierarchy_level=60)
        req = RoleChangeRequest.objects.create(
            initiator=initiator,
            target_user=target,
            requested_role=role,
            status=ApprovalRequestStatus.PENDING,
            expires_at=timezone.now() - timedelta(hours=1),
            reason="test",
        )

        call_command("cleanup_expired_roles")

        req.refresh_from_db()
        assert req.status == ApprovalRequestStatus.EXPIRED
        assert AuditLogEntry.objects.filter(action="roles.approval_timeout").exists()
        assert not UserRole.objects.filter(user=target, role=role, is_active=True).exists()

    def test_expired_approval_request_marked_expired(self):
        initiator = User.objects.create(email="app-init@example.com")
        from apps.roles.models import ApprovalRequest
        req = ApprovalRequest.objects.create(
            request_type="test.action",
            initiator=initiator,
            status=ApprovalRequestStatus.PENDING,
            expires_at=timezone.now() - timedelta(hours=1),
        )

        call_command("cleanup_expired_roles")

        req.refresh_from_db()
        assert req.status == ApprovalRequestStatus.EXPIRED
        assert AuditLogEntry.objects.filter(action="roles.approval_timeout").exists()
