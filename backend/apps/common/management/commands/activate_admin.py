import os

from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand


class Command(BaseCommand):
    help = "Creates or updates the admin account."

    def handle(self, *args, **options):
        User = get_user_model()

        email = os.getenv("DJANGO_SUPERUSER_EMAIL", "adewale@gmail.com")
        password = os.getenv("DJANGO_SUPERUSER_PASSWORD", "entercom01")
        first_name = os.getenv("DJANGO_SUPERUSER_FIRST_NAME", "Adewale")
        last_name = os.getenv("DJANGO_SUPERUSER_LAST_NAME", "Admin")

        admin_user, created = User.objects.get_or_create(
            email=email,
            defaults={
                "first_name": first_name,
                "last_name": last_name,
            },
        )

        admin_user.first_name = first_name
        admin_user.last_name = last_name
        admin_user.is_staff = True
        admin_user.is_superuser = True
        admin_user.is_active = True

        admin_user.set_password(password)
        admin_user.save()

        if created:
            self.stdout.write(
                self.style.SUCCESS(f"Created admin user: {email}")
            )
        else:
            self.stdout.write(
                self.style.SUCCESS(f"Updated admin user: {email}")
            )