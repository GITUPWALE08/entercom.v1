"""Roles domain permissions (see docs/RBAC.md)."""

from rest_framework.exceptions import NotAuthenticated
from rest_framework.permissions import BasePermission

from apps.audit_logs.services.security_audit import (
    SECURITY_ACTION_PERMISSION_DENIED,
    log_security_denial,
)


class FailClosedPermission(BasePermission):
    """
    Global deny-by-default permission class.
    Routes without an explicit, overriding permission_classes declaration inherit
    API defaults and remain closed. Anonymous users receive 401; authenticated
    users receive 403 when this class denies access.
    """

    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            raise NotAuthenticated()

        log_security_denial(
            actor=request.user,
            action=SECURITY_ACTION_PERMISSION_DENIED,
            permission="fail_closed.implicit_deny",
            resource_type="system",
            metadata={"view": view.__class__.__name__},
        )
        return False
