"""Structured monitoring hooks for audit pipeline failures."""

from __future__ import annotations

import logging
from typing import Any, Optional, List, Protocol
from django.conf import settings

logger = logging.getLogger("audit.monitoring")


class MonitoringAdapter(Protocol):
    def emit_failure(
        self,
        action: str,
        resource_type: str,
        critical: bool,
        error: Exception,
        extra: Optional[dict[str, Any]] = None,
    ) -> None:
        ...


class LoggerAdapter:
    def emit_failure(
        self,
        action: str,
        resource_type: str,
        critical: bool,
        error: Exception,
        extra: Optional[dict[str, Any]] = None,
    ) -> None:
        payload = {
            "event": "audit.write_failed",
            "audit_action": action,
            "resource_type": resource_type,
            "critical": critical,
            "error_type": type(error).__name__,
            "error_message": str(error),
            **(extra or {}),
        }
        if critical:
            logger.critical("Critical audit write failure", extra=payload)
        else:
            logger.error("Non-critical audit write failure (fail-open)", extra=payload)


class SentryAdapter:
    def emit_failure(
        self,
        action: str,
        resource_type: str,
        critical: bool,
        error: Exception,
        extra: Optional[dict[str, Any]] = None,
    ) -> None:
        try:
            import sentry_sdk
        except ImportError:
            return
            
        with sentry_sdk.push_scope() as scope:
            scope.set_tag("audit.action", action)
            scope.set_tag("audit.resource_type", resource_type)
            scope.set_tag("audit.critical", critical)
            if extra:
                for k, v in extra.items():
                    scope.set_extra(k, v)
            
            sentry_sdk.capture_exception(error)


_adapters: List[MonitoringAdapter] = [LoggerAdapter()]
if getattr(settings, "AUDIT_USE_SENTRY", False):
    _adapters.append(SentryAdapter())


def emit_audit_write_failure(
    *,
    action: str,
    resource_type: str,
    critical: bool,
    error: Exception,
    extra: Optional[dict[str, Any]] = None,
) -> None:
    for adapter in _adapters:
        try:
            adapter.emit_failure(
                action=action,
                resource_type=resource_type,
                critical=critical,
                error=error,
                extra=extra
            )
        except Exception as e:
            logger.error(f"Monitoring adapter {adapter.__class__.__name__} failed: {e}")

