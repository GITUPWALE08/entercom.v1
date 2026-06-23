import pytest
from django.core.exceptions import ValidationError
from django.db import IntegrityError

from apps.users.enums import UserRole
from apps.users.models import User


@pytest.mark.django_db
def test_create_user_normalizes_email_and_sets_defaults():
    user = User.objects.create_user(
        "Person@Example.com",
        password="test-pass-123",
        first_name="Person",
        last_name="Example",
    )
    user.refresh_from_db()
    assert user.email == "Person@example.com"
    assert user.role == UserRole.CUSTOMER
    assert user.is_active is True
    assert user.is_staff is False
    assert user.is_superuser is False
    assert user.has_usable_password()
    assert user.last_password_change_at is not None


@pytest.mark.django_db
def test_create_superuser_sets_role_and_flags():
    user = User.objects.create_superuser(
        "admin@example.com",
        password="admin-pass-123",
        first_name="Admin",
        last_name="User",
    )
    assert user.is_superuser is True
    assert user.is_staff is True
    assert user.role == UserRole.SUPER_ADMIN


@pytest.mark.django_db
def test_email_unique():
    User.objects.create_user(
        "u1@example.com",
        password="x",
        first_name="U",
        last_name="One",
    )
    with pytest.raises(ValidationError):
        User.objects.create_user(
            "u1@example.com",
            password="y",
            first_name="U",
            last_name="Two",
        )


@pytest.mark.django_db
def test_role_assignment():
    user = User.objects.create_user(
        "tech@example.com",
        password="x",
        first_name="T",
        last_name="E",
        role=UserRole.TECHNICIAN,
    )
    assert user.role == UserRole.TECHNICIAN


@pytest.mark.django_db
def test_create_user_requires_email():
    with pytest.raises(ValueError, match="email"):
        User.objects.create_user(
            "",
            password="x",
            first_name="A",
            last_name="B",
        )


@pytest.mark.django_db
def test_create_user_requires_names():
    with pytest.raises(ValueError, match="first_name"):
        User.objects.create_user(
            "a@example.com",
            password="x",
            first_name="",
            last_name="B",
        )


@pytest.mark.django_db
def test_superuser_requires_staff_flag_consistency():
    with pytest.raises(ValueError, match="is_staff"):
        User.objects.create_user(
            "bad@example.com",
            password="x",
            first_name="B",
            last_name="A",
            is_superuser=True,
            is_staff=False,
        )


@pytest.mark.django_db
def test_invalid_phone_rejected():
    from django.core.exceptions import ValidationError

    with pytest.raises(ValidationError):
        User.objects.create_user(
            "badphone@example.com",
            password="x",
            first_name="A",
            last_name="B",
            phone_number="not-a-valid-phone!!!",
        )
