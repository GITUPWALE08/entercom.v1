"""Audit write policy: critical vs non-critical actions."""

from __future__ import annotations

CRITICAL_PREFIXES: tuple[str, ...] = ("auth.", "security.", "roles.")
NON_CRITICAL_PREFIXES: tuple[str, ...] = ("rbac.cache_", "websocket.disconnect")


def is_critical_action(action: str) -> bool:
    if action.startswith(CRITICAL_PREFIXES):
        return True
    if action.startswith(NON_CRITICAL_PREFIXES):
        return False
    if action.startswith("websocket."):
        return action != "websocket.disconnect"
    if action.startswith("audit."):
        return True
    return True


def retention_class_for_action(action: str) -> str:
    from apps.audit_logs.models import AuditRetentionClass

    if action.startswith(("auth.", "security.", "roles.")):
        return AuditRetentionClass.SECURITY
    return AuditRetentionClass.GENERAL
