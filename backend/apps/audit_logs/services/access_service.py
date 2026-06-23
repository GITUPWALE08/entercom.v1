"""Audit log access authorization."""

from __future__ import annotations

from typing import Any

from apps.audit_logs.permissions import AUDIT_VIEW_PERMISSION
from apps.roles.services.permission_evaluator import require_permission


def require_audit_view(user: Any) -> None:
    require_permission(user, AUDIT_VIEW_PERMISSION, resource_type="audit_logs")
