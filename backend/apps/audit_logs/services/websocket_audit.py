"""WebSocket lifecycle audit logging via AuditService."""

from __future__ import annotations

from typing import Any, Optional

from asgiref.sync import sync_to_async

from apps.audit_logs.services.audit_service import log_action
from core.trace_context import bind_websocket_trace, clear_trace_context


def _header(scope: dict, name: str) -> str:
    name_b = name.lower().encode()
    for key, value in scope.get("headers") or []:
        if key.lower() == name_b:
            return value.decode("latin-1")
    return ""


def bind_scope(scope: dict) -> str:
    """Populate trace contextvars from a Channels WebSocket scope."""
    client = scope.get("client")
    ip_address = client[0] if client else ""
    request_id = scope.get("request_id") or _header(scope, "x-request-id")
    correlation_id = scope.get("correlation_id") or _header(scope, "x-correlation-id")
    return bind_websocket_trace(
        request_id=request_id,
        correlation_id=correlation_id,
        ip_address=ip_address,
        user_agent=_header(scope, "user-agent"),
    )


def _base_metadata(scope: dict, *, close_code: Optional[int] = None, **extra: Any) -> dict:
    meta = {
        "path": scope.get("path", ""),
        "channel": scope.get("type", ""),
        **extra,
    }
    if close_code is not None:
        meta["close_code"] = close_code
    return meta


def log_websocket_event(
    action: str,
    scope: dict,
    *,
    actor: Any = None,
    resource_type: str = "websocket",
    resource_id: Optional[str] = None,
    reason: str = "",
    close_code: Optional[int] = None,
    **metadata: Any,
) -> None:
    bind_scope(scope)
    try:
        log_action(
            action=action,
            actor=actor,
            resource_type=resource_type,
            resource_id=resource_id or scope.get("path"),
            reason=reason,
            metadata=_base_metadata(scope, close_code=close_code, **metadata),
        )
    finally:
        clear_trace_context()


@sync_to_async
def alog_websocket_event(*args, **kwargs) -> None:
    log_websocket_event(*args, **kwargs)
