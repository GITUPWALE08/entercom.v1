"""DRF exception handler with mandatory security denial auditing."""

from __future__ import annotations

import traceback
from typing import Any, Optional

from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import exception_handler as drf_exception_handler
from rest_framework.exceptions import PermissionDenied, NotAuthenticated

from apps.audit_logs.services.security_audit import (
    SECURITY_ACTION_PERMISSION_DENIED,
    log_security_denial,
)
from core.exceptions import AuthorizationError, PermissionDeniedError, ServiceError


def _forbidden_response(detail: str) -> Response:
    return Response({"detail": detail}, status=status.HTTP_403_FORBIDDEN)


def custom_exception_handler(
    exc: Exception, context: dict[str, Any]
) -> Optional[Response]:
    request = context.get("request")

    if isinstance(exc, (PermissionDeniedError, AuthorizationError, PermissionDenied, NotAuthenticated)):
        if not getattr(exc, "audited", False) and request is not None:
            user = getattr(request, "user", None)
            log_security_denial(
                actor=user if user and user.is_authenticated else None,
                action=SECURITY_ACTION_PERMISSION_DENIED,
                permission=getattr(exc, "permission", ""),
                resource_type="api",
                reason=str(exc),
                metadata={"view": context.get("view").__class__.__name__ if context.get("view") else ""},
            )
            exc.audited = True
        
        if isinstance(exc, (PermissionDenied, NotAuthenticated)):
            return drf_exception_handler(exc, context)
            
        return _forbidden_response(str(exc))

    if isinstance(exc, ServiceError):
        if not getattr(exc, "audited", False) and request is not None:
            user = getattr(request, "user", None)
            log_security_denial(
                actor=user if user and user.is_authenticated else None,
                action=SECURITY_ACTION_PERMISSION_DENIED,
                resource_type="api",
                reason=str(exc),
                metadata={"service_error": type(exc).__name__},
            )
            exc.audited = True
        return _forbidden_response("Request could not be completed.")

    response = drf_exception_handler(exc, context)
    return response
