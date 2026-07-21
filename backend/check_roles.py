import sys
import os
import django

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings.base")
django.setup()

from apps.roles.models import Role
roles = Role.objects.all()
for r in roles:
    print(f"Role: {r.name}, Slug: {r.slug}")
