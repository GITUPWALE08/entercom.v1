"""Centralized security denial auditing."""

from __future__ import annotations

from typing import Any, NoReturn, Optional, Type

from apps.audit_logs.services.audit_service import log_action
from core.exceptions import PermissionDeniedError

SECURITY_ACTION_PERMISSION_DENIED = "security.permission_denied"
SECURITY_ACTION_RBAC_DENIED = "security.rbac_denied"
SECURITY_ACTION_ROLE_ESCALATION_DENIED = "security.role_escalation_denied"
SECURITY_ACTION_APPROVAL_DENIED = "security.approval_denied"
SECURITY_ACTION_OVERRIDE_USED = "security.override_used"
SECURITY_ACTION_EMERGENCY_ACCESS = "security.emergency_access"
SECURITY_ACTION_BREAK_GLASS = "security.break_glass"

def _log_critical_event(
    action: str,
    actor: Any,
    actor_role: str,
    reason: str,
    target_resource: str,
    justification: str,
    approval_chain: str,
    metadata: Optional[dict[str, Any]] = None,
) -> Any:
    meta = dict(metadata or {})
    meta.update({
        "actor_role": actor_role,
        "target_resource": target_resource,
        "justification": justification,
        "approval_chain": approval_chain,
        "critical": True,
    })
    return log_action(
        action=action,
        actor=actor,
        resource_type="system",
        resource_id=target_resource,
        reason=reason,
        metadata=meta,
    )

def log_override_used(
    *,
    actor: Any,
    actor_role: str,
    reason: str,
    target_resource: str,
    justification: str,
    approval_chain: str,
    metadata: Optional[dict[str, Any]] = None,
) -> Any:
    return _log_critical_event(
        action=SECURITY_ACTION_OVERRIDE_USED,
        actor=actor,
        actor_role=actor_role,
        reason=reason,
        target_resource=target_resource,
        justification=justification,
        approval_chain=approval_chain,
        metadata=metadata,
    )

def log_emergency_access(
    *,
    actor: Any,
    actor_role: str,
    reason: str,
    target_resource: str,
    justification: str,
    approval_chain: str,
    metadata: Optional[dict[str, Any]] = None,
) -> Any:
    return _log_critical_event(
        action=SECURITY_ACTION_EMERGENCY_ACCESS,
        actor=actor,
        actor_role=actor_role,
        reason=reason,
        target_resource=target_resource,
        justification=justification,
        approval_chain=approval_chain,
        metadata=metadata,
    )

def log_break_glass(
    *,
    actor: Any,
    actor_role: str,
    reason: str,
    target_resource: str,
    justification: str,
    approval_chain: str,
    metadata: Optional[dict[str, Any]] = None,
) -> Any:
    return _log_critical_event(
        action=SECURITY_ACTION_BREAK_GLASS,
        actor=actor,
        actor_role=actor_role,
        reason=reason,
        target_resource=target_resource,
        justification=justification,
        approval_chain=approval_chain,
        metadata=metadata,
    )


def log_security_denial(
    *,
    actor: Any = None,
    action: str,
    permission: str = "",
    resource_type: str = "system",
    resource_id: Optional[str] = None,
    reason: str = "",
    metadata: Optional[dict[str, Any]] = None,
) -> Any:
    meta = dict(metadata or {})
    if permission:
        meta["permission_codename"] = permission
    return log_action(
        action=action,
        actor=actor,
        resource_type=resource_type,
        resource_id=resource_id,
        reason=reason,
        metadata=meta,
    )


def deny_and_raise(
    *,
    actor: Any = None,
    action: str = SECURITY_ACTION_RBAC_DENIED,
    permission: str = "",
    resource_type: str = "system",
    resource_id: Optional[str] = None,
    reason: str = "Access denied",
    metadata: Optional[dict[str, Any]] = None,
    exception_class: Type[PermissionDeniedError] = PermissionDeniedError,
) -> NoReturn:
    log_security_denial(
        actor=actor,
        action=action,
        permission=permission,
        resource_type=resource_type,
        resource_id=resource_id,
        reason=reason,
        metadata=metadata,
    )
    exc = exception_class(reason)
    exc.audited = True  # type: ignore[attr-defined]
    raise exc


def audit_role_escalation_denied(
    *,
    actor: Any,
    reason: str,
    resource_type: str = "user",
    resource_id: Optional[str] = None,
    metadata: Optional[dict[str, Any]] = None,
) -> NoReturn:
    deny_and_raise(
        actor=actor,
        action=SECURITY_ACTION_ROLE_ESCALATION_DENIED,
        resource_type=resource_type,
        resource_id=resource_id,
        reason=reason,
        metadata=metadata,
    )


def audit_approval_denied(
    *,
    actor: Any,
    reason: str,
    resource_type: str = "user",
    resource_id: Optional[str] = None,
    metadata: Optional[dict[str, Any]] = None,
) -> NoReturn:
    deny_and_raise(
        actor=actor,
        action=SECURITY_ACTION_APPROVAL_DENIED,
        resource_type=resource_type,
        resource_id=resource_id,
        reason=reason,
        metadata=metadata,
    )


def audit_rbac_denied(
    *,
    actor: Any,
    permission: str,
    reason: str,
    resource_type: str = "system",
    resource_id: Optional[str] = None,
    metadata: Optional[dict[str, Any]] = None,
) -> NoReturn:
    deny_and_raise(
        actor=actor,
        action=SECURITY_ACTION_RBAC_DENIED,
        permission=permission,
        resource_type=resource_type,
        resource_id=resource_id,
        reason=reason,
        metadata=metadata,
    )
