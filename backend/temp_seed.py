import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.local')
django.setup()

from apps.roles.models import RoleDefinition

roles = [
    ('superadmin', 'Super Admin', 100),
    ('manager', 'Manager', 80),
    ('staff', 'Staff', 50),
    ('technician', 'Technician', 20),
    ('customer', 'Customer', 0)
]

for r in roles:
    role, created = RoleDefinition.objects.get_or_create(
        slug=r[0], 
        defaults={'name': r[1], 'hierarchy_level': r[2]}
    )
    if created:
        print(f"Created role: {role.name}")
    else:
        print(f"Role already exists: {role.name}")
