from django.core.management.base import BaseCommand
from apps.roles.models import PermissionDefinition, RoleDefinition, RolePermission
from django.core.cache import cache

class Command(BaseCommand):
    help = 'Seeds the audit.view permission for administrative roles and clears cache'

    def handle(self, *args, **kwargs):
        self.stdout.write("Creating audit.view permission...")
        audit_perm, _ = PermissionDefinition.objects.get_or_create(
            codename='audit.view',
            defaults={
                'name': 'View Audit Logs',
                'description': 'Can view audit logs'
            }
        )

        roles = RoleDefinition.objects.filter(slug__in=['superadmin', 'manager', 'admin'])
        for role in roles:
            RolePermission.objects.get_or_create(
                role=role,
                permission=audit_perm
            )
            self.stdout.write(f"Granted audit.view to {role.slug}")

        cache.clear()
        self.stdout.write(self.style.SUCCESS("Successfully seeded audit.view and cleared cache."))
