"""Database-level immutability tests (PostgreSQL only)."""

import pytest
from django.contrib.auth import get_user_model
from django.db import connection

from apps.audit_logs.context import allow_audit_create
from apps.audit_logs.models import AuditLogEntry
from apps.audit_logs.services.audit_service import log_action

User = get_user_model()

pytestmark = pytest.mark.skipif(
    connection.vendor != "postgresql",
    reason="PostgreSQL trigger immutability tests require PostgreSQL",
)


@pytest.mark.django_db
class TestPostgresImmutabilityTriggers:
    @pytest.fixture
    def entry(self, db):
        user = User.objects.create(email="pg-immut@example.com")
        return log_action(action="test.pg", actor=user)

    def test_raw_update_blocked(self, entry):
        with pytest.raises(Exception, match="immutable"):
            with connection.cursor() as cursor:
                cursor.execute(
                    "UPDATE audit_logs_entry SET reason = %s WHERE id = %s",
                    ["tamper", str(entry.pk)],
                )

    def test_raw_delete_blocked(self, entry):
        with pytest.raises(Exception, match="immutable"):
            with connection.cursor() as cursor:
                cursor.execute(
                    "DELETE FROM audit_logs_entry WHERE id = %s",
                    [str(entry.pk)],
                )

    def test_bulk_create_blocked(self, db):
        user = User.objects.create(email="bulk@example.com")
        with pytest.raises(Exception, match="bulk_create"):
            AuditLogEntry.objects.bulk_create(
                [
                    AuditLogEntry(
                        action="forged",
                        resource_type="system",
                        actor=user,
                    )
                ]
            )

    def test_direct_create_without_gate_blocked(self, db):
        user = User.objects.create(email="direct@example.com")
        with pytest.raises(Exception, match="log_action"):
            AuditLogEntry.objects.create(
                action="forged",
                resource_type="system",
                actor=user,
            )

    def test_retention_purge_allows_general_delete(self, db):
        user = User.objects.create(email="purge@example.com")
        entry = log_action(
            action="rbac.cache_invalidated",
            resource_type="user",
            resource_id=str(user.id),
        )
        with connection.cursor() as cursor:
            cursor.execute("SET LOCAL audit.retention_purge = 'on'")
            cursor.execute(
                "DELETE FROM audit_logs_entry WHERE id = %s",
                [str(entry.pk)],
            )
        assert not AuditLogEntry.objects.filter(pk=entry.pk).exists()
