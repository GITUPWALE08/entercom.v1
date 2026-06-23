"""Read-only audit log query and export (no logging side effects)."""

from __future__ import annotations

import csv
import json
from io import StringIO
from typing import Any, Optional

from django.db.models import QuerySet

from apps.audit_logs.models import AuditLogEntry


def list_entries(
    *,
    action: Optional[str] = None,
    actor_email: Optional[str] = None,
    resource_type: Optional[str] = None,
    request_id: Optional[str] = None,
    correlation_id: Optional[str] = None,
    date_from=None,
    date_to=None,
) -> QuerySet[AuditLogEntry]:
    qs = AuditLogEntry.objects.all().order_by("-created_at")
    if action:
        qs = qs.filter(action=action)
    if actor_email:
        qs = qs.filter(actor_email_snapshot__icontains=actor_email)
    if resource_type:
        qs = qs.filter(resource_type=resource_type)
    if request_id:
        qs = qs.filter(request_id=request_id)
    if correlation_id:
        qs = qs.filter(correlation_id=correlation_id)
    if date_from:
        qs = qs.filter(created_at__gte=date_from)
    if date_to:
        qs = qs.filter(created_at__lte=date_to)
    return qs


def serialize_entry(entry: AuditLogEntry) -> dict[str, Any]:
    return {
        "id": str(entry.id),
        "created_at": entry.created_at.isoformat(),
        "action": entry.action,
        "actor_id": entry.actor_id_snapshot,
        "actor_email": entry.actor_email_snapshot,
        "actor_role": entry.actor_role_snapshot,
        "resource_type": entry.resource_type,
        "resource_id": entry.resource_id,
        "request_id": entry.request_id,
        "correlation_id": entry.correlation_id,
        "ip_address": entry.ip_address,
        "user_agent": entry.user_agent,
        "reason": entry.reason,
        "metadata": entry.metadata,
        "retention_class": entry.retention_class,
        "legal_hold": entry.legal_hold,
        "archived_at": entry.archived_at.isoformat() if entry.archived_at else None,
    }


def export_csv(qs: QuerySet[AuditLogEntry]) -> str:
    buffer = StringIO()
    writer = csv.writer(buffer)
    writer.writerow(
        [
            "id",
            "created_at",
            "action",
            "actor_email",
            "actor_role",
            "resource_type",
            "resource_id",
            "request_id",
            "correlation_id",
            "ip_address",
            "reason",
        ]
    )
    for entry in qs.iterator():
        writer.writerow(
            [
                entry.id,
                entry.created_at.isoformat(),
                entry.action,
                entry.actor_email_snapshot,
                entry.actor_role_snapshot,
                entry.resource_type,
                entry.resource_id,
                entry.request_id,
                entry.correlation_id,
                entry.ip_address,
                entry.reason,
            ]
        )
    return buffer.getvalue()


def export_json(qs: QuerySet[AuditLogEntry]) -> str:
    return json.dumps([serialize_entry(e) for e in qs[:5000]], indent=2)
