import uuid

from django.conf import settings
from django.core.exceptions import PermissionDenied
from django.db import models

from apps.audit_logs.context import is_audit_create_allowed


class AuditRetentionClass(models.TextChoices):
    SECURITY = "security", "Security (7 years)"
    GENERAL = "general", "General (1 year)"


class AuditLogQuerySet(models.QuerySet):
    def delete(self):
        raise PermissionDenied("Audit log entries cannot be deleted.")

    def update(self, **kwargs):
        raise PermissionDenied("Audit log entries cannot be modified.")

    def bulk_update(self, objs, fields, batch_size=None):
        raise PermissionDenied("Audit log entries cannot be modified.")


class AuditLogManager(models.Manager):
    def get_queryset(self):
        return AuditLogQuerySet(self.model, using=self._db)

    def create(self, **kwargs):
        if not is_audit_create_allowed():
            raise PermissionDenied(
                "Audit log entries may only be created via log_action()."
            )
        return super().create(**kwargs)

    def bulk_create(self, objs, batch_size=None, ignore_conflicts=False):
        raise PermissionDenied(
            "Audit log entries cannot be bulk_created; use log_action()."
        )


class AuditLogEntry(models.Model):
    """
    Immutable audit trail (populate from services, not serializers).
    Append-only at ORM and database layers.
    """

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    occurred_at = models.DateTimeField(db_index=True, help_text="When event actually happened")

    actor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.DO_NOTHING,
        db_constraint=False,
        related_name="audit_actions",
    )
    actor_id_snapshot = models.CharField(max_length=64, blank=True, db_index=True)
    actor_email_snapshot = models.CharField(max_length=255, blank=True, db_index=True)
    actor_role_snapshot = models.CharField(max_length=512, blank=True)

    action = models.CharField(max_length=128, db_index=True)

    resource_type = models.CharField(max_length=128, db_index=True)
    resource_id = models.CharField(max_length=128, db_index=True, null=True, blank=True)

    request_id = models.CharField(max_length=64, db_index=True, null=True, blank=True)
    correlation_id = models.CharField(max_length=64, db_index=True, null=True, blank=True)

    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.TextField(blank=True)

    reason = models.TextField(blank=True)
    metadata = models.JSONField(default=dict, blank=True)

    retention_class = models.CharField(
        max_length=16,
        choices=AuditRetentionClass.choices,
        default=AuditRetentionClass.GENERAL,
        db_index=True,
    )
    legal_hold = models.BooleanField(default=False, db_index=True)
    archived_at = models.DateTimeField(null=True, blank=True, db_index=True)

    objects = AuditLogManager()

    class Meta:
        db_table = "audit_logs_entry"
        ordering = ("-created_at",)
        verbose_name = "audit log entry"
        verbose_name_plural = "audit log entries"
        indexes = [
            models.Index(fields=["retention_class", "created_at"]),
            models.Index(fields=["legal_hold", "archived_at"]),
        ]

    def __str__(self) -> str:
        label = self.actor_email_snapshot or (
            self.actor.email if self.actor else "System"
        )
        return f"{self.created_at.isoformat()} - {label} - {self.action}"

    def save(self, *args, **kwargs):
        if self.pk and AuditLogEntry.objects.filter(pk=self.pk).exists():
            raise PermissionDenied(
                "Audit log entries are immutable and cannot be modified."
            )
        if not is_audit_create_allowed():
            raise PermissionDenied(
                "Audit log entries may only be created via log_action()."
            )
        super().save(*args, **kwargs)

    def delete(self, *args, **kwargs):
        raise PermissionDenied("Audit log entries are immutable and cannot be deleted.")
