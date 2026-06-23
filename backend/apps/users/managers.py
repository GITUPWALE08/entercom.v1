from __future__ import annotations

from typing import TYPE_CHECKING, Any

from django.contrib.auth.base_user import BaseUserManager

if TYPE_CHECKING:
    from apps.users.models import User


class UserManager(BaseUserManager["User"]):
    """Email-normalized user creation for the custom user model."""

    use_in_migrations = True

    def create_user(
        self,
        email: str,
        password: str | None = None,
        **extra_fields: Any,
    ) -> User:
        if not email:
            raise ValueError("The email field must be set")
        email = self.normalize_email(email)
        first_name = (extra_fields.pop("first_name", None) or "").strip()
        last_name = (extra_fields.pop("last_name", None) or "").strip()
        if not first_name or not last_name:
            raise ValueError("The first_name and last_name fields must be set")

        from apps.users.enums import UserRole

        extra_fields.setdefault("is_staff", False)
        extra_fields.setdefault("is_superuser", False)
        extra_fields.setdefault("is_active", True)
        extra_fields.setdefault("role", UserRole.CUSTOMER)

        if extra_fields.get("is_superuser") and not extra_fields.get("is_staff"):
            raise ValueError("Superusers must have is_staff=True.")

        user = self.model(
            email=email,
            first_name=first_name,
            last_name=last_name,
            **extra_fields,
        )
        user.set_password(password)
        user.full_clean(exclude=["password"])
        user.save(using=self._db)
        return user

    def create_superuser(
        self,
        email: str,
        password: str | None = None,
        **extra_fields: Any,
    ) -> User:
        from apps.users.enums import UserRole

        extra_fields["is_staff"] = True
        extra_fields["is_superuser"] = True
        extra_fields["is_active"] = True
        extra_fields["role"] = UserRole.SUPER_ADMIN

        return self.create_user(email, password, **extra_fields)
