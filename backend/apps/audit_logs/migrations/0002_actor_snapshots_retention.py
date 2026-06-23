from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("audit_logs", "0001_initial"),
    ]

    operations = [
        migrations.AddField(
            model_name="auditlogentry",
            name="actor_id_snapshot",
            field=models.CharField(blank=True, db_index=True, max_length=64),
        ),
        migrations.AddField(
            model_name="auditlogentry",
            name="actor_email_snapshot",
            field=models.CharField(blank=True, db_index=True, max_length=255),
        ),
        migrations.AddField(
            model_name="auditlogentry",
            name="actor_role_snapshot",
            field=models.CharField(blank=True, max_length=512),
        ),
        migrations.AddField(
            model_name="auditlogentry",
            name="retention_class",
            field=models.CharField(
                choices=[("security", "Security (7 years)"), ("general", "General (1 year)")],
                db_index=True,
                default="general",
                max_length=16,
            ),
        ),
        migrations.AddField(
            model_name="auditlogentry",
            name="legal_hold",
            field=models.BooleanField(db_index=True, default=False),
        ),
        migrations.AddField(
            model_name="auditlogentry",
            name="archived_at",
            field=models.DateTimeField(blank=True, db_index=True, null=True),
        ),
        migrations.AddIndex(
            model_name="auditlogentry",
            index=models.Index(
                fields=["retention_class", "created_at"],
                name="audit_logs_retention_idx",
            ),
        ),
        migrations.AddIndex(
            model_name="auditlogentry",
            index=models.Index(
                fields=["legal_hold", "archived_at"],
                name="audit_logs_hold_archive_idx",
            ),
        ),
    ]
