from django.db import migrations


def seed_permissions(apps, schema_editor):
    PermissionDefinition = apps.get_model("roles", "PermissionDefinition")
    perms = [
        ("audit.view", "View Audit Logs", "audit", "view"),
        ("websocket.connect", "WebSocket Connect", "websocket", "connect"),
    ]
    for codename, name, resource, action in perms:
        PermissionDefinition.objects.get_or_create(
            codename=codename,
            defaults={"name": name, "resource": resource, "action": action, "is_active": True},
        )


def unseed_permissions(apps, schema_editor):
    PermissionDefinition = apps.get_model("roles", "PermissionDefinition")
    PermissionDefinition.objects.filter(
        codename__in=["audit.view", "websocket.connect"]
    ).delete()


class Migration(migrations.Migration):

    dependencies = [
        ("audit_logs", "0004_retention_trigger_bypass"),
        ("roles", "0001_initial"),
    ]

    operations = [
        migrations.RunPython(seed_permissions, unseed_permissions),
    ]
