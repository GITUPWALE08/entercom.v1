from typing import Any, Optional, Set, Tuple

from django.core.cache import cache
from django.db import transaction
from django.db.models import F, Q
from django.utils import timezone

from apps.audit_logs.services.audit_service import log_action
from apps.audit_logs.services.security_audit import (
    SECURITY_ACTION_RBAC_DENIED,
    audit_rbac_denied,
    log_security_denial,
)
from apps.roles.models import PermissionCacheVersion, RolePermission
from core.exceptions import PermissionDeniedError


def get_permission_cache_key(user_id: Any) -> str:
    return f"rbac:perms:{user_id}"


def _permission_cache_version(user_id: Any) -> int:
    v = (
        PermissionCacheVersion.objects.filter(user_id=user_id)
        .values_list("version", flat=True)
        .first()
    )
    return int(v) if v is not None else 0


def invalidate_cache(user_id: Any) -> None:
    """Flushes RBAC cache for a user and bumps the permission cache version (atomic)."""
    cache.delete(get_permission_cache_key(user_id))
    with transaction.atomic():
        _, created = PermissionCacheVersion.objects.select_for_update().get_or_create(
            user_id=user_id,
            defaults={"version": 1},
        )
        if not created:
            PermissionCacheVersion.objects.filter(user_id=user_id).update(
                version=F("version") + 1
            )

    log_action(
        action="rbac.cache_invalidated",
        resource_type="user",
        resource_id=str(user_id),
        metadata={"user_id": str(user_id)},
    )


def _load_permissions_from_db(user: Any) -> Set[str]:
    now = timezone.now()
    return set(
        RolePermission.objects.filter(
            role__user_roles__user=user,
            role__user_roles__is_active=True,
            role__is_active=True,
            permission__is_active=True,
        )
        .filter(
            Q(role__user_roles__expires_at__isnull=True)
            | Q(role__user_roles__expires_at__gt=now)
        )
        .values_list("permission__codename", flat=True)
        .distinct()
    )


def has_permission(user: Any, permission_codename: str) -> bool:
    """
    Evaluates global/role permission.
    Single Source of Truth for RBAC evaluation.
    Does not audit denials; use require_permission() for authorization gates.
    """
    if not user or not user.is_authenticated:
        return False

    cache_key = get_permission_cache_key(user.id)
    db_version = _permission_cache_version(user.id)
    cached: Optional[Tuple[int, Set[str]]] = cache.get(cache_key)

    if cached is not None:
        cached_version, perms = cached
        if cached_version == db_version:
            return permission_codename in perms

    perms = _load_permissions_from_db(user)
    db_version = _permission_cache_version(user.id)
    cache.set(cache_key, (db_version, perms), timeout=900)

    return permission_codename in perms


def require_permission(
    user: Any,
    permission_codename: str,
    *,
    resource_type: str = "system",
    resource_id: Optional[str] = None,
    reason: Optional[str] = None,
) -> None:
    """Authorization gate: audit and raise on denial."""
    if has_permission(user, permission_codename):
        return
    audit_rbac_denied(
        actor=user,
        permission=permission_codename,
        reason=reason or f"Missing permission: {permission_codename}",
        resource_type=resource_type,
        resource_id=resource_id,
    )


def has_object_permission(user: Any, permission_codename: str, obj: Any) -> bool:
    """
    Evaluates ownership predicates and fine-grained access with hierarchy protection.
    """
    if not has_permission(user, permission_codename):
        log_security_denial(
            actor=user,
            action=SECURITY_ACTION_RBAC_DENIED,
            permission=permission_codename,
            resource_type=type(obj).__name__,
            resource_id=str(getattr(obj, "pk", "")) or None,
            reason=f"Missing permission: {permission_codename}",
        )
        return False

    target_user = None
    if hasattr(obj, "email") and hasattr(obj, "id"):
        target_user = obj
    elif hasattr(obj, "customer"):
        target_user = obj.customer
    elif hasattr(obj, "technician"):
        target_user = obj.technician
    elif hasattr(obj, "user"):
        target_user = obj.user
    elif hasattr(obj, "created_by"):
        target_user = obj.created_by
    elif hasattr(obj, "assigned_to"):
        target_user = obj.assigned_to

    if target_user and target_user.id != user.id:
        from apps.roles.hierarchy import get_user_max_hierarchy, user_is_super_admin

        if not user_is_super_admin(user):
            actor_hierarchy = get_user_max_hierarchy(user)
            target_hierarchy = get_user_max_hierarchy(target_user)

            if actor_hierarchy <= target_hierarchy:
                log_security_denial(
                    actor=user,
                    action=SECURITY_ACTION_RBAC_DENIED,
                    permission=permission_codename,
                    resource_type="user",
                    resource_id=str(target_user.id),
                    reason="Hierarchy prevents access to target resource",
                    metadata={"actor_hierarchy": actor_hierarchy, "target_hierarchy": target_hierarchy},
                )
                return False

    if target_user and target_user.id == user.id:
        return True

    if permission_codename.endswith("_all"):
        return True

    return False


def require_object_permission(
    user: Any, permission_codename: str, obj: Any
) -> None:
    if has_object_permission(user, permission_codename, obj):
        return
    
    from apps.audit_logs.services.security_audit import deny_and_raise
    deny_and_raise(
        actor=user,
        action=SECURITY_ACTION_RBAC_DENIED,
        permission=permission_codename,
        resource_type=type(obj).__name__,
        resource_id=str(getattr(obj, "pk", "")) or None,
        reason="Object permission denied",
    )
