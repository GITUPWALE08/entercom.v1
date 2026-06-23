"""Audit logs API permissions."""

from rest_framework.permissions import BasePermission

from apps.audit_logs.services.security_audit import (
    SECURITY_ACTION_RBAC_DENIED,
    log_security_denial,
)
from apps.roles.services.permission_evaluator import has_permission

AUDIT_VIEW_PERMISSION = "audit.view"


class HasAuditViewPermission(BasePermission):
    def has_permission(self, request, view) -> bool:
        if not request.user or not request.user.is_authenticated:
            return False
        if has_permission(request.user, AUDIT_VIEW_PERMISSION):
            return True
        log_security_denial(
            actor=request.user,
            action=SECURITY_ACTION_RBAC_DENIED,
            permission=AUDIT_VIEW_PERMISSION,
            resource_type="audit_logs",
            reason=f"Missing permission: {AUDIT_VIEW_PERMISSION}",
        )
        return False
