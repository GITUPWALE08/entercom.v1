from django.apps import AppConfig


class AuditLogsConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "apps.audit_logs"
    label = "audit_logs"
    verbose_name = "Audit logs"

    def ready(self) -> None:
        import core.celery_trace  # noqa: F401 — register Celery trace signal handlers


