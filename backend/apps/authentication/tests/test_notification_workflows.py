import pytest
from django.contrib.auth import get_user_model
from django.utils import timezone
from datetime import timedelta
from unittest.mock import patch
from rest_framework.exceptions import AuthenticationFailed

from apps.authentication.models import EmailVerificationToken
from apps.authentication.services.auth_service import AuthService
from apps.audit_logs.models import AuditLog

User = get_user_model()

pytestmark = pytest.mark.django_db

@patch('apps.notification.services.DispatchOrchestrator.dispatch_event')
class TestAuthenticationNotificationWorkflows:

    def setup_method(self):
        self.user = User.objects.create_user(
            email="test@example.com",
            password="testpassword123",
            first_name="Test",
            last_name="User"
        )

    def test_registration_triggers_verification_email(self, mock_dispatch):
        user, refresh = AuthService.register(
            data={"email": "newuser@example.com", "password": "password123", "first_name": "New"},
            request_metadata={"ip_address": "127.0.0.1"}
        )

        assert not user.email_verified
        assert EmailVerificationToken.objects.filter(user=user).exists()
        
        mock_dispatch.assert_called_with(
            event_type="verify_email",
            recipient_id=user.id,
            context={"verification_link": mock_dispatch.call_args.kwargs['context']['verification_link'], "first_name": "New"},
            resource_type="user",
            resource_id=str(user.id),
            category="alerts",
            title="Verify Your Email Address",
            message=mock_dispatch.call_args.kwargs['message'],
            is_system_critical=True
        )

    def test_verify_email_success_triggers_welcome(self, mock_dispatch):
        token = EmailVerificationToken.objects.create(user=self.user, token="test-token-123")
        
        AuthService.verify_email("test-token-123")

        self.user.refresh_from_db()
        assert self.user.email_verified is True
        assert not EmailVerificationToken.objects.filter(token="test-token-123").exists()

        mock_dispatch.assert_called_with(
            event_type="welcome",
            recipient_id=self.user.id,
            context={"first_name": self.user.first_name},
            resource_type="user",
            resource_id=str(self.user.id),
            category="updates",
            title="Welcome to Entercom",
            message="Your account has been created and verified successfully.",
            is_system_critical=False
        )

    def test_verify_email_expired_token(self, mock_dispatch):
        token = EmailVerificationToken.objects.create(
            user=self.user, 
            token="expired-token"
        )
        token.expires_at = timezone.now() - timedelta(days=2)
        token.save()

        with pytest.raises(AuthenticationFailed):
            AuthService.verify_email("expired-token")

        assert not mock_dispatch.called
        assert not EmailVerificationToken.objects.filter(token="expired-token").exists()

    def test_change_password_triggers_notification(self, mock_dispatch):
        AuthService.change_password(self.user, "testpassword123", "newpassword456")

        mock_dispatch.assert_called_once_with(
            event_type="password_changed",
            recipient_id=self.user.id,
            context={"first_name": self.user.first_name},
            resource_type="user",
            resource_id=str(self.user.id),
            category="alerts",
            title="Password Changed Notification",
            message="Your password was successfully changed.",
            is_system_critical=True
        )

    def test_change_email_triggers_notification_and_verification(self, mock_dispatch):
        AuthService.change_email(self.user, "updated@example.com")

        self.user.refresh_from_db()
        assert self.user.email == "updated@example.com"
        assert not self.user.email_verified

        assert mock_dispatch.call_count == 2
        
        # Call 1: Email changed notification
        call1 = mock_dispatch.call_args_list[0]
        assert call1.kwargs['event_type'] == "email_changed"
        assert call1.kwargs['context']['old_email'] == "test@example.com"
        assert call1.kwargs['context']['new_email'] == "updated@example.com"
        
        # Call 2: Email verification for new email
        call2 = mock_dispatch.call_args_list[1]
        assert call2.kwargs['event_type'] == "verify_email"

    def test_password_reset_success_triggers_notification(self, mock_dispatch):
        from django.contrib.auth.tokens import default_token_generator
        from django.utils.encoding import force_bytes
        from django.utils.http import urlsafe_base64_encode

        uid = urlsafe_base64_encode(force_bytes(self.user.pk))
        token = default_token_generator.make_token(self.user)

        AuthService.complete_password_reset(
            user_id=self.user.id,
            token=token,
            new_password="newresetpassword123"
        )

        mock_dispatch.assert_called_once_with(
            event_type="password_reset_completed",
            recipient_id=self.user.id,
            context={"first_name": self.user.first_name},
            resource_type="user",
            resource_id=str(self.user.id),
            category="alerts",
            title="Password Reset Successful",
            message="Your password has been reset successfully.",
            is_system_critical=True
        )
