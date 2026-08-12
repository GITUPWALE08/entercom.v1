# Generated manually

from django.db import migrations

def seed_roles(apps, schema_editor):
    RoleDefinition = apps.get_model('roles', 'RoleDefinition')
    
    roles_to_seed = [
        ('superadmin', 'Super Admin', 'Full system access', 100, True),
        ('manager', 'Manager', 'Manager access', 80, True),
        ('staff', 'Staff', 'Staff access', 50, True),
        ('technician', 'Technician', 'Technician access', 20, True),
        ('customer', 'Customer', 'Customer access', 0, True),
    ]
    
    for slug, name, description, hierarchy_level, is_system_role in roles_to_seed:
        RoleDefinition.objects.get_or_create(
            slug=slug,
            defaults={
                'name': name,
                'description': description,
                'hierarchy_level': hierarchy_level,
                'is_system_role': is_system_role,
                'is_active': True
            }
        )

def unseed_roles(apps, schema_editor):
    RoleDefinition = apps.get_model('roles', 'RoleDefinition')
    RoleDefinition.objects.filter(
        slug__in=['superadmin', 'manager', 'staff', 'technician', 'customer']
    ).delete()


class Migration(migrations.Migration):

    dependencies = [
        ('roles', '0003_seed_audit_view_permission'),
    ]

    operations = [
        migrations.RunPython(seed_roles, unseed_roles),
    ]
