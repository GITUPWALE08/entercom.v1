"""Audit log retention, archival, and legal-hold enforcement."""

from __future__ import annotations

from datetime import timedelta
from typing import Any

from django.conf import settings
from django.db import connection, transaction
from django.utils import timezone

from apps.audit_logs.models import AuditLogEntry, AuditRetentionClass
from apps.audit_logs.services.audit_service import log_action

SECURITY_RETENTION_DAYS = 7 * 365
GENERAL_RETENTION_DAYS = 365


def _enable_retention_purge() -> None:
    if connection.vendor == "postgresql":
        with connection.cursor() as cursor:
            cursor.execute("SET LOCAL audit.retention_purge = 'on'")
    elif connection.vendor == "sqlite":
        with connection.cursor() as cursor:
            cursor.execute("INSERT OR REPLACE INTO _audit_maintenance (key, value) VALUES ('retention_purge', 'on')")


def _disable_retention_purge() -> None:
    if connection.vendor == "sqlite":
        with connection.cursor() as cursor:
            cursor.execute("DELETE FROM _audit_maintenance WHERE key = 'retention_purge'")


def run_retention(*, dry_run: bool = False, chunk_size: int = None) -> dict[str, Any]:
    if chunk_size is None:
        chunk_size = getattr(settings, "AUDIT_RETENTION_CHUNK_SIZE", 1000)

    now = timezone.now()
    security_cutoff = now - timedelta(days=SECURITY_RETENTION_DAYS)
    general_cutoff = now - timedelta(days=GENERAL_RETENTION_DAYS)

    security_archive_qs = AuditLogEntry.objects.filter(
        retention_class=AuditRetentionClass.SECURITY,
        legal_hold=False,
        archived_at__isnull=True,
        created_at__lt=security_cutoff,
    )
    general_purge_qs = AuditLogEntry.objects.filter(
        retention_class=AuditRetentionClass.GENERAL,
        legal_hold=False,
        created_at__lt=general_cutoff,
    )

    security_archive_count = security_archive_qs.count()
    general_purge_count = general_purge_qs.count()
    
    archived_count = 0
    purged_count = 0

    if not dry_run:
        # Batch update for archiving
        if security_archive_count > 0:
            while True:
                with transaction.atomic():
                    _enable_retention_purge()
                    
                    pks = [str(pk) for pk in list(security_archive_qs.values_list('pk', flat=True)[:chunk_size])]
                    if not pks:
                        _disable_retention_purge()
                        break
                    
                    # Note: .update() is blocked by AuditLogQuerySet. 
                    # We need to bypass it or use raw SQL.
                    with connection.cursor() as cursor:
                        placeholders = ', '.join(['%s'] * len(pks))
                        cursor.execute(
                            f"UPDATE audit_logs_entry SET archived_at = %s WHERE id IN ({placeholders})",
                            [now] + pks
                        )
                    archived_count += len(pks)

        # Batch delete for purging
        if general_purge_count > 0:
            while True:
                with transaction.atomic():
                    _enable_retention_purge()
                    
                    pks = [str(pk) for pk in list(general_purge_qs.values_list('pk', flat=True)[:chunk_size])]
                    if not pks:
                        _disable_retention_purge()
                        break
                    
                    # .delete() is blocked by AuditLogQuerySet, using raw SQL
                    with connection.cursor() as cursor:
                        placeholders = ', '.join(['%s'] * len(pks))
                        cursor.execute(
                            f"DELETE FROM audit_logs_entry WHERE id IN ({placeholders})",
                            pks
                        )
                    purged_count += len(pks)
            _disable_retention_purge()

    summary = {
        "security_archived": archived_count or security_archive_count if dry_run else archived_count,
        "general_purged": purged_count or general_purge_count if dry_run else purged_count,
        "security_retention_days": SECURITY_RETENTION_DAYS,
        "general_retention_days": GENERAL_RETENTION_DAYS,
        "dry_run": dry_run,
        "chunk_size": chunk_size
    }

    log_action(
        action="audit.retention_enforced",
        resource_type="audit_logs",
        metadata=summary,
    )
    return summary
