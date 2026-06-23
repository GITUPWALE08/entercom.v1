"""Propagate request/correlation IDs across HTTP, Celery, and management commands."""

from __future__ import annotations

import uuid
from typing import Any, Optional

from core.middleware.request_id import (
    correlation_id_ctx,
    get_client_ip,
    ip_address_ctx,
    request_id_ctx,
    user_agent_ctx,
)

TRACE_HEADER_REQUEST_ID = "request_id"
TRACE_HEADER_CORRELATION_ID = "correlation_id"
TRACE_HEADER_IP_ADDRESS = "ip_address"
TRACE_HEADER_USER_AGENT = "user_agent"


def snapshot_trace_context() -> dict[str, str]:
    return {
        TRACE_HEADER_REQUEST_ID: request_id_ctx.get() or "",
        TRACE_HEADER_CORRELATION_ID: correlation_id_ctx.get() or "",
        TRACE_HEADER_IP_ADDRESS: ip_address_ctx.get() or "",
        TRACE_HEADER_USER_AGENT: user_agent_ctx.get() or "",
    }


def restore_trace_context(headers: Optional[dict[str, Any]] = None) -> None:
    headers = headers or {}
    request_id_ctx.set(str(headers.get(TRACE_HEADER_REQUEST_ID) or ""))
    correlation_id_ctx.set(str(headers.get(TRACE_HEADER_CORRELATION_ID) or ""))
    ip_address_ctx.set(str(headers.get(TRACE_HEADER_IP_ADDRESS) or ""))
    user_agent_ctx.set(str(headers.get(TRACE_HEADER_USER_AGENT) or ""))


def clear_trace_context() -> None:
    request_id_ctx.set("")
    correlation_id_ctx.set("")
    ip_address_ctx.set("")
    user_agent_ctx.set("")


def bind_http_request(request) -> str:
    """Bind trace context from an HTTP request; returns the request_id."""
    rid = request.META.get("HTTP_X_REQUEST_ID") or str(uuid.uuid4())
    cid = request.META.get("HTTP_X_CORRELATION_ID") or rid
    request_id_ctx.set(rid)
    correlation_id_ctx.set(cid)
    ip_address_ctx.set(get_client_ip(request))
    user_agent_ctx.set(request.META.get("HTTP_USER_AGENT", ""))
    return rid


def bind_standalone_trace(
    *,
    request_id: Optional[str] = None,
    correlation_id: Optional[str] = None,
) -> str:
    """Bind trace context for management commands or background jobs without HTTP."""
    rid = request_id or request_id_ctx.get() or str(uuid.uuid4())
    cid = correlation_id or correlation_id_ctx.get() or rid
    request_id_ctx.set(rid)
    correlation_id_ctx.set(cid)
    ip_address_ctx.set(ip_address_ctx.get() or "")
    user_agent_ctx.set(user_agent_ctx.get() or "")
    return rid


def bind_websocket_trace(
    *,
    request_id: str = "",
    correlation_id: str = "",
    ip_address: str = "",
    user_agent: str = "",
) -> str:
    """Bind trace context from a Channels WebSocket scope."""
    rid = request_id or str(uuid.uuid4())
    cid = correlation_id or rid
    request_id_ctx.set(rid)
    correlation_id_ctx.set(cid)
    ip_address_ctx.set(ip_address)
    user_agent_ctx.set(user_agent)
    return rid
