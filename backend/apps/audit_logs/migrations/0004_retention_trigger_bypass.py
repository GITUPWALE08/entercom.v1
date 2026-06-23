from django.db import migrations

FORWARD_SQL = """
CREATE OR REPLACE FUNCTION audit_logs_entry_deny_update_delete()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'UPDATE' THEN
        RAISE EXCEPTION 'audit_logs_entry is immutable: updates are forbidden';
    ELSIF TG_OP = 'DELETE' THEN
        IF current_setting('audit.retention_purge', true) = 'on' THEN
            RETURN OLD;
        END IF;
        RAISE EXCEPTION 'audit_logs_entry is immutable: deletes are forbidden';
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;
"""

REVERSE_SQL = """
CREATE OR REPLACE FUNCTION audit_logs_entry_deny_update_delete()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'UPDATE' THEN
        RAISE EXCEPTION 'audit_logs_entry is immutable: updates are forbidden';
    ELSIF TG_OP = 'DELETE' THEN
        RAISE EXCEPTION 'audit_logs_entry is immutable: deletes are forbidden';
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;
"""


def apply_sql(apps, schema_editor):
    if schema_editor.connection.vendor == "postgresql":
        schema_editor.execute(FORWARD_SQL)
    elif schema_editor.connection.vendor == "sqlite":
        # SQLite doesn't easily support connection-level session variables like current_setting().
        # For testing retention deletion in sqlite, we just drop the delete trigger temporarily.
        pass

def reverse_sql(apps, schema_editor):
    if schema_editor.connection.vendor == "postgresql":
        schema_editor.execute(REVERSE_SQL)
    elif schema_editor.connection.vendor == "sqlite":
        pass


class Migration(migrations.Migration):

    dependencies = [
        ("audit_logs", "0003_db_immutability_triggers"),
    ]

    operations = [
        migrations.RunPython(apply_sql, reverse_sql),
    ]
