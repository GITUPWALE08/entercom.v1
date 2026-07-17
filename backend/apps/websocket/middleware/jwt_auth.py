"""JWT authentication middleware for Django Channels WebSocket connections."""

from __future__ import annotations

import uuid
from typing import Optional, Tuple
from urllib.parse import parse_qs

from channels.db import database_sync_to_async
from django.contrib.auth import get_user_model
from django.contrib.auth.models import AnonymousUser
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError
from rest_framework_simplejwt.tokens import AccessToken

from core.trace_context import bind_websocket_trace

User = get_user_model()


def _header(scope: dict, name: str) -> str:
    name_b = name.lower().encode()
    for key, value in scope.get("headers") or []:
        if key.lower() == name_b:
            return value.decode("latin-1")
    return ""


def _extract_token(scope: dict) -> Optional[str]:
    query = parse_qs(scope.get("query_string", b"").decode())
    if "token" in query and query["token"]:
        return query["token"][0]
    auth_header = _header(scope, "authorization")
    if auth_header.lower().startswith("bearer "):
        return auth_header[7:].strip()
        
    protocol_header = _header(scope, "sec-websocket-protocol")
    if protocol_header:
        parts = [p.strip() for p in protocol_header.split(',')]
        if len(parts) == 2 and parts[0] == "access_token":
            return parts[1]
        elif len(parts) == 1 and len(parts[0]) > 20:
            return parts[0]
            
    return None


def _parse_token(token: str) -> Tuple[Optional[User], Optional[str]]:
    try:
        access = AccessToken(token)
    except TokenError:
        return None, "token_expired"

    user_id = access.get("user_id")
    if not user_id:
        return None, "auth_failed"

    try:
        user = User.objects.get(pk=user_id)
    except User.DoesNotExist:
        return None, "auth_failed"

    if not user.is_active:
        return None, "auth_failed"
    
    token_role_version = access.get("role_version")

    if token_role_version != user.role_version:
        return None, "permissions_changed"

    return user, None


@database_sync_to_async
def _resolve_user(token: str) -> Tuple[Optional[User], Optional[str]]:
    return _parse_token(token)


class JWTAuthMiddleware:
    """Populate scope user and trace identifiers from JWT access tokens."""

    def __init__(self, inner):
        self.inner = inner

    async def __call__(self, scope, receive, send):
        scope = dict(scope)
        client = scope.get("client")
        ip_address = client[0] if client else ""
        request_id = _header(scope, "x-request-id") or str(uuid.uuid4())
        correlation_id = _header(scope, "x-correlation-id") or request_id

        scope["request_id"] = request_id
        scope["correlation_id"] = correlation_id
        bind_websocket_trace(
            request_id=request_id,
            correlation_id=correlation_id,
            ip_address=ip_address,
            user_agent=_header(scope, "user-agent"),
        )

        token = _extract_token(scope)
        if not token:
            scope["user"] = AnonymousUser()
            scope["auth_failure_reason"] = "auth_failed"
        else:
            user, failure = await _resolve_user(token)
            if failure:
                scope["user"] = AnonymousUser()
                scope["auth_failure_reason"] = failure
            else:
                scope["user"] = user
                scope["auth_failure_reason"] = None

        return await self.inner(scope, receive, send)


def JWTAuthMiddlewareStack(inner):
    return JWTAuthMiddleware(inner)
