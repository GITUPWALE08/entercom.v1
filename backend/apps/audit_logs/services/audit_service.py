import logging
from typing import Any, Optional
import uuid

from django.conf import settings
from django.contrib.auth import get_user_model
from django.utils import timezone

from apps.audit_logs.actor_snapshot import capture_actor_snapshot
from apps.audit_logs.context import allow_audit_create
from apps.audit_logs.exceptions import AuditFailureError
from apps.audit_logs.models import AuditLogEntry
from apps.audit_logs.services.audit_policy import (
    is_critical_action,
    retention_class_for_action,
)
from apps.audit_logs.services.monitoring import emit_audit_write_failure
from core.middleware.request_id import (
    correlation_id_ctx,
    ip_address_ctx,
    request_id_ctx,
    user_agent_ctx,
)

User = get_user_model()
logger = logging.getLogger(__name__)
security_logger = logging.getLogger("forensic.audit")


def log_action(
    action: str,
    actor: Any = None,
    resource_type: str = "system",
    resource_id: Optional[str] = None,
    reason: str = "",
    metadata: Optional[dict[str, Any]] = None,
    *,
    retention_class: Optional[str] = None,
    legal_hold: bool = False,
) -> Optional[AuditLogEntry]:
    """
    Standardizes audit logging across the platform.
    Critical actions fail closed if persistence fails.
    Uses Dual-Write (DB + Stream) to ensure forensic survival during rollbacks.
    """
    snapshot = capture_actor_snapshot(actor)
    critical = is_critical_action(action)
    
    # Check if async is enabled and this is a non-critical action
    use_async = getattr(settings, "AUDIT_ASYNC_ENABLED", False) and not critical

    log_data = {
        "id": str(uuid.uuid4()), 
        "actor_id": str(actor.id) if actor and hasattr(actor, "id") else None,
        "actor_id_snapshot": snapshot["actor_id"],
        "actor_email_snapshot": snapshot["actor_email"],
        "actor_role_snapshot": snapshot["actor_role"],
        "action": action,
        "occurred_at": timezone.now().isoformat(),
        "resource_type": resource_type,
        "resource_id": resource_id,
        "request_id": request_id_ctx.get() or None,
        "correlation_id": correlation_id_ctx.get() or None,
        "ip_address": ip_address_ctx.get() or None,
        "user_agent": user_agent_ctx.get() or "",
        "reason": reason,
        "metadata": metadata or {},
        "retention_class": retention_class or retention_class_for_action(action),
        "legal_hold": legal_hold,
    }

    # FORENSIC SURVIVAL: Write to log stream IMMEDIATELY.
    # This survives DB rollbacks and provides OOB visibility.
    security_logger.info(
        f"AUDIT_EVENT:{action}",
        extra={
            "audit_data": log_data,
            "forensic": True
        }
    )

    if use_async:
        from apps.audit_logs.tasks import process_async_audit_log
        try:
            process_async_audit_log.delay(log_data)
            return None
        except Exception as exc:
            # Fallback to sync if celery submission fails
            logger.warning(f"Failed to submit async audit task, falling back to sync: {exc}")

    try:
        with allow_audit_create():
            # Check if actor is a real model instance before assigning to ForeignKey
            db_actor = actor if isinstance(actor, User) else None
            return AuditLogEntry.objects.create(
                id=log_data["id"],
                actor=db_actor,
                actor_id_snapshot=log_data["actor_id_snapshot"],
                actor_email_snapshot=log_data["actor_email_snapshot"],
                actor_role_snapshot=log_data["actor_role_snapshot"],
                action=log_data["action"],
                occurred_at=log_data["occurred_at"],
                resource_type=log_data["resource_type"],
                resource_id=log_data["resource_id"],
                request_id=log_data["request_id"],
                correlation_id=log_data["correlation_id"],
                ip_address=log_data["ip_address"],
                user_agent=log_data["user_agent"],
                reason=log_data["reason"],
                metadata=log_data["metadata"],
                retention_class=log_data["retention_class"],
                legal_hold=log_data["legal_hold"],
            )
    except Exception as exc:
        emit_audit_write_failure(
            action=action,
            resource_type=resource_type,
            critical=critical,
            error=exc,
            extra={
                "request_id": request_id_ctx.get(),
                "correlation_id": correlation_id_ctx.get(),
                "actor_id": snapshot["actor_id"],
            },
        )
        if critical:
            raise AuditFailureError(action, str(exc)) from exc
        return None


def log_permission_denial(
    actor: Any,
    permission_codename: str,
    resource_type: str = "system",
    resource_id: Optional[str] = None,
    metadata: Optional[dict[str, Any]] = None,
) -> AuditLogEntry:
    return log_action(
        action="security.permission_denied",
        actor=actor,
        resource_type=resource_type,
        resource_id=resource_id,
        reason=f"Missing permission: {permission_codename}",
        metadata={
            "permission_codename": permission_codename,
            **(metadata or {}),
        },
    )
