import pytest
from django.contrib.auth import get_user_model
from django.contrib.auth.tokens import default_token_generator
from django.utils.http import urlsafe_base64_encode
from django.utils.encoding import force_bytes
from rest_framework_simplejwt.token_blacklist.models import OutstandingToken
from rest_framework_simplejwt.tokens import RefreshToken

from apps.authentication.models import UserSession
from apps.authentication.services.auth_service import AuthService

User = get_user_model()

@pytest.fixture
def user():
    return User.objects.create_user(
        email="test@example.com",
        password="oldpassword123",
        first_name="Test",
        last_name="User"
    )

@pytest.mark.django_db
class TestPasswordResetRevocation:
    """
    Verifies that completing a password reset revokes all active sessions and tokens.
    """

    def test_password_reset_revokes_all_sessions(self, user):
        # 1. Create multiple sessions for the user
        refresh1 = RefreshToken.for_user(user)
        AuthService.track_session(user, refresh1, {"ip_address": "127.0.0.1", "user_agent": "Browser 1"})
        
        refresh2 = RefreshToken.for_user(user)
        AuthService.track_session(user, refresh2, {"ip_address": "127.0.0.2", "user_agent": "Browser 2"})

        # Verify sessions are active
        assert UserSession.objects.filter(user=user, is_active=True).count() == 2
        assert OutstandingToken.objects.filter(user=user).count() == 2

        # 2. Generate reset token
        token = default_token_generator.make_token(user)
        uid = urlsafe_base64_encode(force_bytes(user.pk))

        # 3. Complete password reset
        AuthService.complete_password_reset(
            user_id=user.id,
            token=token,
            new_password="newpassword123"
        )

        # 4. Verify all sessions and tokens are revoked
        assert UserSession.objects.filter(user=user, is_active=True).count() == 0
        assert OutstandingToken.objects.filter(user=user).count() == 0

    def test_password_reset_does_not_revoke_other_users_sessions(self, user):
        # 1. Create session for our user
        refresh_user = RefreshToken.for_user(user)
        AuthService.track_session(user, refresh_user, {"ip_address": "127.0.0.1", "user_agent": "User Browser"})

        # 2. Create another user and their session
        other_user = User.objects.create_user(
            email="other@example.com",
            password="otherpassword",
            first_name="Other",
            last_name="User"
        )
        refresh_other = RefreshToken.for_user(other_user)
        AuthService.track_session(other_user, refresh_other, {"ip_address": "127.0.0.3", "user_agent": "Other Browser"})

        # 3. Reset password for the first user
        token = default_token_generator.make_token(user)
        AuthService.complete_password_reset(
            user_id=user.id,
            token=token,
            new_password="newpassword123"
        )

        # 4. Verify only the first user's sessions are revoked
        assert UserSession.objects.filter(user=user, is_active=True).count() == 0
        assert UserSession.objects.filter(user=other_user, is_active=True).count() == 1
        assert OutstandingToken.objects.filter(user=other_user).count() == 1
