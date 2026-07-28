from django.db import migrations

def create_audit_permission(apps, schema_editor):
    PermissionDefinition = apps.get_model('roles', 'PermissionDefinition')
    RoleDefinition = apps.get_model('roles', 'RoleDefinition')
    RolePermission = apps.get_model('roles', 'RolePermission')

    # Create permission
    audit_perm, _ = PermissionDefinition.objects.get_or_create(
        codename='audit.view',
        defaults={
            'name': 'View Audit Logs',
            'description': 'Can view audit logs'
        }
    )

    # Assign to admin, superadmin, manager
    roles = RoleDefinition.objects.filter(slug__in=['superadmin', 'manager', 'admin'])
    for role in roles:
        RolePermission.objects.get_or_create(
            role=role,
            permission=audit_perm
        )

    # Clear cache to ensure new permissions are loaded for existing users
    from django.core.cache import cache
    cache.clear()

def remove_audit_permission(apps, schema_editor):
    PermissionDefinition = apps.get_model('roles', 'PermissionDefinition')
    PermissionDefinition.objects.filter(codename='audit.view').delete()

class Migration(migrations.Migration):
    dependencies = [
        ('roles', '0002_rolechangerequest_alter_userrole_expires_at_and_more'),
    ]

    operations = [
        migrations.RunPython(create_audit_permission, remove_audit_permission),
    ]
