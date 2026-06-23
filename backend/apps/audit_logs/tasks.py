import logging
from celery import shared_task
from django.db import transaction
from apps.audit_logs.models import AuditLogEntry
from apps.audit_logs.exceptions import AuditFailureError
from apps.audit_logs.services.monitoring import emit_audit_write_failure
from apps.audit_logs.context import allow_audit_create

logger = logging.getLogger(__name__)

@shared_task(bind=True, max_retries=3, default_retry_delay=5, acks_late=True, reject_on_worker_lost=True)
def process_async_audit_log(self, log_data: dict):
    """
    Asynchronously write an audit log entry.
    """
    action = log_data.get("action")
    resource_type = log_data.get("resource_type")
    actor_id = log_data.get("actor_id_snapshot")
    
    try:
        with allow_audit_create():
            with transaction.atomic():
                AuditLogEntry.objects.get_or_create(
                    id=log_data["id"],
                    defaults=log_data
                )
    except Exception as exc:
        emit_audit_write_failure(
            action=action,
            resource_type=resource_type,
            critical=False,
            error=exc,
            extra={
                "request_id": log_data.get("request_id"),
                "correlation_id": log_data.get("correlation_id"),
                "actor_id": actor_id,
                "async_mode": True,
            },
        )
        
        if self.request.retries >= self.max_retries:
            raise

        try:
            self.retry(exc=exc)
        except self.MaxRetriesExceededError:
            logger.error(f"Failed to save async audit log after {self.max_retries} retries: {exc}")


@shared_task
def trace_probe():
    """
    Minimal task to verify trace context propagation in tests.
    """
    from core.middleware.request_id import request_id_ctx, correlation_id_ctx
    return {
        "request_id": request_id_ctx.get(),
        "correlation_id": correlation_id_ctx.get(),
    }


