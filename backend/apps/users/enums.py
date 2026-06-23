from django.db import models


class UserRole(models.TextChoices):
    """Primary platform persona for filtering, admin UX, and defaults.

    Data-driven RBAC (`apps.roles`) remains the source of fine-grained
    permissions; this field is the canonical coarse role on the identity row.
    """

    SUPER_ADMIN = "SUPER_ADMIN", "Super Admin"
    MANAGER = "MANAGER", "Manager"
    STAFF = "STAFF", "Staff"
    TECHNICIAN = "TECHNICIAN", "Technician"
    CUSTOMER = "CUSTOMER", "Customer"
