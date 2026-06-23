"""RBAC hierarchy helpers (effective assignments only — excludes expired roles)."""

from __future__ import annotations

from typing import TYPE_CHECKING

from django.db.models import Max, Q
from django.utils import timezone

from apps.roles.models import UserRole

if TYPE_CHECKING:
    from django.contrib.auth.base_user import AbstractBaseUser


def effective_user_roles_qs(user: AbstractBaseUser):
    """Active role assignments that are not past expires_at."""
    now = timezone.now()
    return user.role_assignments.filter(is_active=True).filter(
        Q(expires_at__isnull=True) | Q(expires_at__gt=now)
    )


def get_user_max_hierarchy(user: AbstractBaseUser) -> int:
    """Highest hierarchy_level among effective (non-expired) role assignments."""
    value = effective_user_roles_qs(user).aggregate(
        Max("role__hierarchy_level")
    )["role__hierarchy_level__max"]
    return value or 0


def user_is_super_admin(user: AbstractBaseUser) -> bool:
    """
    Super Admin in RBAC terms: active, non-expired assignment to the superadmin role.
    Do not use Django is_superuser for authorization decisions.
    """
    if not user or not user.is_authenticated:
        return False
    return effective_user_roles_qs(user).filter(role__slug="superadmin").exists()
