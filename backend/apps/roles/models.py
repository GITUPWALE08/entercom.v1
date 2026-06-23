import uuid
from django.conf import settings
from django.db import models

from apps.common.models import TimeStampedModel


class PermissionDefinition(TimeStampedModel):
    """Declarative permission codenames (data-driven RBAC foundation)."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    codename = models.CharField(max_length=128, unique=True, db_index=True)
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    resource = models.CharField(max_length=64, db_index=True, default="system")
    action = models.CharField(max_length=64, default="view")
    is_active = models.BooleanField(default=True)

    class Meta:
        db_table = "roles_permission"
        ordering = ("codename",)

    def __str__(self) -> str:
        return self.codename

    def save(self, *args, **kwargs):
        if self._state.adding is False:
            original = PermissionDefinition.objects.get(pk=self.pk)
            if original.codename != self.codename:
                raise ValueError("Permission codename is immutable.")
        super().save(*args, **kwargs)


class RoleDefinition(TimeStampedModel):
    """Named role grouping (customer, technician, staff, manager, superadmin, ...)."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=255)
    slug = models.SlugField(max_length=128, unique=True)
    description = models.TextField(blank=True)
    hierarchy_level = models.IntegerField(default=0)
    is_system_role = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)

    class Meta:
        db_table = "roles_role"
        ordering = ("-hierarchy_level", "name")

    def __str__(self) -> str:
        return self.name

    def save(self, *args, **kwargs):
        if self._state.adding is False:
            original = RoleDefinition.objects.get(pk=self.pk)
            if original.slug != self.slug:
                raise ValueError("Role slug is immutable.")
            if original.hierarchy_level != self.hierarchy_level:
                # We could allow this for superusers, but for P0 hardening we'll make it immutable.
                # If it needs to change, it should be a migration or a superuser-only action.
                raise ValueError("Role hierarchy_level is protected and immutable.")
        super().save(*args, **kwargs)


class RolePermission(models.Model):
    role = models.ForeignKey(RoleDefinition, on_delete=models.CASCADE, related_name="role_permissions")
    permission = models.ForeignKey(PermissionDefinition, on_delete=models.CASCADE, related_name="role_permissions")
    granted_at = models.DateTimeField(auto_now_add=True)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="granted_permissions",
    )

    class Meta:
        db_table = "roles_role_permission"
        unique_together = ("role", "permission")
    def __str__(self) -> str:
        return f"{self.role.slug} -> {self.permission.codename}"


class UserRole(TimeStampedModel):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="role_assignments",
    )
    role = models.ForeignKey(
        RoleDefinition,
        on_delete=models.CASCADE,
        related_name="user_roles",
    )
    assigned_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="assignments_made",
    )
    approved_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="assignments_approved",
    )
    reason = models.TextField(blank=True)
    expires_at = models.DateTimeField(null=True, blank=True, db_index=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        db_table = "roles_user_role"
        constraints = [
            models.UniqueConstraint(fields=("user", "role"), name="uniq_user_role"),
        ]

    def __str__(self) -> str:
        return f"{self.user} - {self.role.slug}"


class ApprovalRequestStatus(models.TextChoices):
    PENDING = "PENDING", "Pending"
    APPROVED = "APPROVED", "Approved"
    REJECTED = "REJECTED", "Rejected"
    EXPIRED = "EXPIRED", "Expired"


class ApprovalRequest(TimeStampedModel):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    request_type = models.CharField(max_length=64, db_index=True)
    initiator = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="initiated_approvals",
    )
    target_user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="target_approvals",
        null=True,
        blank=True,
    )
    status = models.CharField(
        max_length=32,
        choices=ApprovalRequestStatus.choices,
        default=ApprovalRequestStatus.PENDING,
        db_index=True,
    )
    approved_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="acted_approvals",
    )
    expires_at = models.DateTimeField(null=True, blank=True)
    reason = models.TextField(blank=True)
    metadata = models.JSONField(default=dict, blank=True)

    class Meta:
        db_table = "roles_approval_request"
        constraints = [
            models.CheckConstraint(
                check=~models.Q(initiator=models.F("approved_by")),
                name="approval_initiator_not_approver"
            )
        ]

    def __str__(self) -> str:
        return f"{self.request_type} - {self.status} by {self.initiator}"


class RoleChangeRequest(TimeStampedModel):
    """Specific dual-control request for high-tier role assignments."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    initiator = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="initiated_role_changes",
    )
    target_user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="target_role_changes",
    )
    requested_role = models.ForeignKey(
        RoleDefinition,
        on_delete=models.CASCADE,
        related_name="role_change_requests",
    )
    status = models.CharField(
        max_length=32,
        choices=ApprovalRequestStatus.choices,
        default=ApprovalRequestStatus.PENDING,
        db_index=True,
    )
    approved_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="approved_role_changes",
    )
    expires_at = models.DateTimeField()
    reason = models.TextField()

    class Meta:
        db_table = "roles_role_change_request"
        constraints = [
            models.CheckConstraint(
                check=~models.Q(initiator=models.F("approved_by")),
                name="role_change_initiator_not_approver"
            )
        ]

    def __str__(self) -> str:
        return f"Role Change: {self.target_user} -> {self.requested_role.slug} ({self.status})"


class PermissionCacheVersion(models.Model):
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        primary_key=True,
        related_name="permission_cache_version",
    )
    version = models.IntegerField(default=1)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "roles_permission_cache_version"

    def __str__(self) -> str:
        return f"{self.user} - v{self.version}"

    def save(self, *args, **kwargs):
        if self.pk:
            # Prevent manual version downgrades or resets via standard save if needed
            # But usually it's incremented.
            pass
        super().save(*args, **kwargs)

