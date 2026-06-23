import pytest
from django.contrib.auth import get_user_model
from django.contrib.auth.tokens import default_token_generator

from apps.audit_logs.models import AuditLogEntry
from apps.authentication.services.auth_service import AuthService

User = get_user_model()


@pytest.mark.django_db
class TestPasswordResetAudit:
    def test_password_reset_requested_existing_user(self):
        user = User.objects.create_user(
            email="reset@example.com",
            password="oldpass123",
            first_name="R",
            last_name="U",
        )
        AuthService.request_password_reset(user.email)
        assert AuditLogEntry.objects.filter(action="auth.password_reset_requested").exists()

    def test_password_reset_requested_unknown_email(self):
        AuthService.request_password_reset("unknown@example.com")
        assert AuditLogEntry.objects.filter(action="auth.password_reset_requested").exists()

    def test_password_reset_completed(self):
        user = User.objects.create_user(
            email="complete@example.com",
            password="oldpass123",
            first_name="C",
            last_name="U",
        )
        token = default_token_generator.make_token(user)
        AuthService.complete_password_reset(
            user_id=str(user.pk), token=token, new_password="newpass12345"
        )
        assert AuditLogEntry.objects.filter(action="auth.password_reset_completed").exists()

    def test_password_reset_failed_bad_token(self):
        user = User.objects.create_user(
            email="badtoken@example.com",
            password="oldpass123",
            first_name="B",
            last_name="T",
        )
        with pytest.raises(Exception):
            AuthService.complete_password_reset(
                user_id=str(user.pk), token="invalid", new_password="newpass12345"
            )
        assert AuditLogEntry.objects.filter(action="auth.password_reset_failed").exists()
