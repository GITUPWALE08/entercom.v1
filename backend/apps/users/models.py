from __future__ import annotations

import uuid

from django.contrib.auth.models import AbstractBaseUser, PermissionsMixin
from django.core import validators
from django.core.exceptions import ValidationError
from django.db import models
from django.utils import timezone

from apps.users.enums import UserRole
from apps.users.managers import UserManager

_phone_validator = validators.RegexValidator(
    regex=r"^$|^\+?[0-9\-\s\(\)]{7,20}$",
    message="Enter a valid phone number or leave blank.",
)


class User(AbstractBaseUser, PermissionsMixin):
    """Email-only identity row; UUID primary key for stable cross-service references."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    email = models.EmailField("email address", unique=True, db_index=True)
    first_name = models.CharField(max_length=150, blank=False)
    last_name = models.CharField(max_length=150, blank=False)
    phone_number = models.CharField(
        max_length=32,
        blank=True,
        default="",
        validators=[_phone_validator],
    )
    address = models.TextField(blank=True, default="")

    is_staff = models.BooleanField(
        "staff status",
        default=False,
        help_text="Designates whether the user can log into the Django admin site.",
    )

    role = models.CharField(
        max_length=32,
        choices=UserRole.choices,
        default=UserRole.CUSTOMER,
        db_index=True,
    )

    email_verified = models.BooleanField(default=False, db_index=True)
    phone_verified = models.BooleanField(default=False, db_index=True)

    failed_login_attempts = models.PositiveSmallIntegerField(default=0)
    locked_until = models.DateTimeField(null=True, blank=True, db_index=True)
    last_login_ip = models.GenericIPAddressField(null=True, blank=True)
    last_password_change_at = models.DateTimeField(null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    updated_at = models.DateTimeField(auto_now=True)
    deleted_at = models.DateTimeField(null=True, blank=True, db_index=True)
    last_activity_at = models.DateTimeField(null=True, blank=True)
    is_active = models.BooleanField(default=False)

    mfa_enabled = models.BooleanField(default=False)
    profile_image = models.URLField(max_length=500, blank=True, default="")
    role_version = models.PositiveIntegerField(default=1, help_text="Increment when permissions/roles change")

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS: list[str] = ["first_name", "last_name"]

    objects = UserManager()

    class Meta:
        db_table = "users_user"
        ordering = ("email",)
        verbose_name = "user"
        verbose_name_plural = "users"

    def __str__(self) -> str:
        return self.email

    def clean(self) -> None:
        super().clean()
        self.email = UserManager.normalize_email(self.email)
        if self.is_superuser and not self.is_staff:
            raise ValidationError(
                {"is_staff": "Superusers must have is_staff=True."},
            )

    def save(self, *args, **kwargs) -> None:
        self.email = self.__class__.objects.normalize_email(self.email)
        is_new = self._state.adding
        super().save(*args, **kwargs)
        if is_new and self.last_password_change_at is None and self.has_usable_password():
            now = timezone.now()
            User.objects.filter(pk=self.pk).update(
                last_password_change_at=now,
                updated_at=now,
            )
            self.last_password_change_at = now
            self.updated_at = now

class TechnicianApplicationStatus(models.TextChoices):
    PENDING = "pending", "Pending"
    UNDER_REVIEW = "under_review", "Under Review"
    APPROVED = "approved", "Approved"
    REJECTED = "rejected", "Rejected"

class TechnicianApplication(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="technician_application")
    skills = models.JSONField(default=list)
    status = models.CharField(max_length=20, choices=TechnicianApplicationStatus.choices, default=TechnicianApplicationStatus.PENDING)
    document_urls = models.JSONField(default=list)
    notes = models.TextField(blank=True, default="")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "users_technician_application"
