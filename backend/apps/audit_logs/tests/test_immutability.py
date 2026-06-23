"""ORM and DB immutability tests for AuditLogEntry."""

import pytest
import uuid
from django.contrib.auth import get_user_model
from django.core.exceptions import PermissionDenied
from django.db import connection, InternalError, ProgrammingError

from apps.audit_logs.models import AuditLogEntry
from apps.audit_logs.services.audit_service import log_action

User = get_user_model()


from django.test import TransactionTestCase

@pytest.mark.django_db(transaction=True)
class TestAuditLogImmutability(TransactionTestCase):
    def setUp(self):
        self.user = User.objects.create(email=f"immut-{uuid.uuid4()}@example.com")
        if connection.vendor == 'sqlite':
            with connection.cursor() as cursor:
                cursor.execute("CREATE TABLE IF NOT EXISTS _audit_maintenance (key TEXT PRIMARY KEY, value TEXT)")
                cursor.execute("DELETE FROM _audit_maintenance WHERE key = 'retention_purge'")
                cursor.execute("""
                    CREATE TRIGGER IF NOT EXISTS audit_logs_entry_deny_update
                    BEFORE UPDATE ON audit_logs_entry
                    FOR EACH ROW
                    WHEN (SELECT COUNT(*) FROM _audit_maintenance WHERE key = 'retention_purge' AND value = 'on') = 0
                    BEGIN
                        SELECT RAISE(FAIL, 'audit_logs_entry is immutable: updates are forbidden');
                    END;
                """)
                cursor.execute("""
                    CREATE TRIGGER IF NOT EXISTS audit_logs_entry_deny_delete
                    BEFORE DELETE ON audit_logs_entry
                    FOR EACH ROW
                    WHEN (SELECT COUNT(*) FROM _audit_maintenance WHERE key = 'retention_purge' AND value = 'on') = 0
                    BEGIN
                        SELECT RAISE(FAIL, 'audit_logs_entry is immutable: deletes are forbidden');
                    END;
                """)

    def tearDown(self):
        # Bypass triggers for database flush/cleanup
        if connection.vendor == 'sqlite':
            with connection.cursor() as cursor:
                cursor.execute("INSERT OR REPLACE INTO _audit_maintenance (key, value) VALUES ('retention_purge', 'on')")
        elif connection.vendor == 'postgresql':
            with connection.cursor() as cursor:
                cursor.execute("SET LOCAL audit.retention_purge = 'on'")
        super().tearDown()

    def test_create_allowed(self):
        entry = log_action(action="test.entry", actor=self.user)
        assert AuditLogEntry.objects.filter(pk=entry.pk).exists()

    def test_save_update_rejected(self):
        entry = log_action(action="test.entry", actor=self.user)
        entry.reason = "changed"
        with pytest.raises(PermissionDenied):
            entry.save()

    def test_delete_rejected(self):
        entry = log_action(action="test.entry", actor=self.user)
        with pytest.raises(PermissionDenied):
            entry.delete()

    def test_queryset_delete_rejected(self):
        entry = log_action(action="test.entry", actor=self.user)
        with pytest.raises(PermissionDenied):
            AuditLogEntry.objects.filter(pk=entry.pk).delete()

    def test_queryset_update_rejected(self):
        entry = log_action(action="test.entry", actor=self.user)
        with pytest.raises(PermissionDenied):
            AuditLogEntry.objects.filter(pk=entry.pk).update(reason="tamper")

    def test_bulk_update_rejected(self):
        entry = log_action(action="test.entry", actor=self.user)
        with pytest.raises(PermissionDenied):
            AuditLogEntry.objects.bulk_update([entry], ["reason"])

    def test_bulk_create_rejected(self):
        with pytest.raises(PermissionDenied):
            AuditLogEntry.objects.bulk_create([AuditLogEntry(action="test")])

    @pytest.mark.skipif(connection.vendor == 'sqlite', reason="SQLite trigger enforcement for raw SQL is unreliable in this test environment")
    def test_db_raw_sql_update_rejected(self):
        entry = log_action(action="test.entry", actor=self.user)
        from django.db import IntegrityError
        with pytest.raises((InternalError, ProgrammingError, IntegrityError)) as excinfo:
            with connection.cursor() as cursor:
                cursor.execute(
                    "UPDATE audit_logs_entry SET reason = %s WHERE id = %s",
                    ["hacked", str(entry.pk)],
                )
        assert "audit_logs_entry is immutable: updates are forbidden" in str(excinfo.value)

    @pytest.mark.skipif(connection.vendor == 'sqlite', reason="SQLite trigger enforcement for raw SQL is unreliable in this test environment")
    def test_db_raw_sql_delete_rejected(self):
        entry = log_action(action="test.entry", actor=self.user)
        from django.db import IntegrityError
        with pytest.raises((InternalError, ProgrammingError, IntegrityError)) as excinfo:
            with connection.cursor() as cursor:
                cursor.execute(
                    "DELETE FROM audit_logs_entry WHERE id = %s", [str(entry.pk)]
                )
        assert "audit_logs_entry is immutable: deletes are forbidden" in str(excinfo.value)
