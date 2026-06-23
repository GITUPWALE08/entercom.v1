from django.db import migrations


FORWARD_SQL = """
CREATE OR REPLACE FUNCTION audit_logs_entry_deny_update_delete()
RETURNS TRIGGER AS $$
BEGIN
    -- Allow deletion/update ONLY if retention_purge is explicitly enabled for this session
    IF current_setting('audit.retention_purge', true) = 'on' THEN
        IF TG_OP = 'DELETE' THEN
            RETURN OLD;
        ELSE
            RETURN NEW;
        END IF;
    END IF;

    IF TG_OP = 'UPDATE' THEN
        RAISE EXCEPTION 'audit_logs_entry is immutable: updates are forbidden';
    ELSIF TG_OP = 'DELETE' THEN
        RAISE EXCEPTION 'audit_logs_entry is immutable: deletes are forbidden';
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS audit_logs_entry_immutable ON audit_logs_entry;

CREATE TRIGGER audit_logs_entry_immutable
BEFORE UPDATE OR DELETE ON audit_logs_entry
FOR EACH ROW
EXECUTE PROCEDURE audit_logs_entry_deny_update_delete();
"""

REVERSE_SQL = """
DROP TRIGGER IF EXISTS audit_logs_entry_immutable ON audit_logs_entry;
DROP FUNCTION IF EXISTS audit_logs_entry_deny_update_delete();
"""


def apply_postgres_triggers(apps, schema_editor):
    if schema_editor.connection.vendor == "postgresql":
        schema_editor.execute(FORWARD_SQL)
    elif schema_editor.connection.vendor == "sqlite":
        # SQLite bypass mechanism via maintenance table
        schema_editor.execute("CREATE TABLE IF NOT EXISTS _audit_maintenance (key TEXT PRIMARY KEY, value TEXT)")
        
        schema_editor.execute("""
            CREATE TRIGGER IF NOT EXISTS audit_logs_entry_deny_update
            BEFORE UPDATE ON audit_logs_entry
            FOR EACH ROW
            WHEN (SELECT COUNT(*) FROM _audit_maintenance WHERE key = 'retention_purge' AND value = 'on') = 0
            BEGIN
                SELECT RAISE(FAIL, 'audit_logs_entry is immutable: updates are forbidden');
            END;
        """)
        schema_editor.execute("""
            CREATE TRIGGER IF NOT EXISTS audit_logs_entry_deny_delete
            BEFORE DELETE ON audit_logs_entry
            FOR EACH ROW
            WHEN (SELECT COUNT(*) FROM _audit_maintenance WHERE key = 'retention_purge' AND value = 'on') = 0
            BEGIN
                SELECT RAISE(FAIL, 'audit_logs_entry is immutable: deletes are forbidden');
            END;
        """)


def reverse_postgres_triggers(apps, schema_editor):
    if schema_editor.connection.vendor == "postgresql":
        schema_editor.execute(REVERSE_SQL)
    elif schema_editor.connection.vendor == "sqlite":
        schema_editor.execute("DROP TRIGGER IF EXISTS audit_logs_entry_deny_update;")
        schema_editor.execute("DROP TRIGGER IF EXISTS audit_logs_entry_deny_delete;")
        schema_editor.execute("DROP TABLE IF EXISTS _audit_maintenance;")


class Migration(migrations.Migration):

    dependencies = [
        ("audit_logs", "0002_actor_snapshots_retention"),
    ]

    operations = [
        migrations.RunPython(apply_postgres_triggers, reverse_postgres_triggers),
    ]
