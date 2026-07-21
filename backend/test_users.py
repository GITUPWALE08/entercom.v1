import sys
import os
import django

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings.base")
django.setup()

from apps.users.models import User
from apps.roles.models import RoleDefinition

role_name = "technician"
users = User.objects.filter(
    role_assignments__role__slug__iexact=role_name,
    role_assignments__is_active=True
).distinct()

print(f"Found {users.count()} users with role '{role_name}'")
for u in users:
    print(u.email, u.role_assignments.all())
