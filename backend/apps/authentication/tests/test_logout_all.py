import pytest
from django.contrib.auth import get_user_model
from rest_framework_simplejwt.token_blacklist.models import OutstandingToken, BlacklistedToken
from rest_framework_simplejwt.tokens import RefreshToken

from apps.authentication.models import UserSession
from apps.authentication.services.auth_service import AuthService

User = get_user_model()

@pytest.fixture
def user():
    return User.objects.create_user(
        email="logout_test@example.com",
        password="password123",
        first_name="Logout",
        last_name="Test"
    )

@pytest.mark.django_db
class TestLogoutAll:
    """
    Verifies that Logout-all correctly invalidates all active sessions and tokens.
    """

    def test_logout_all_invalidates_all_sessions(self, user):
        # 1. Create multiple sessions (simulating multiple devices)
        refresh1 = RefreshToken.for_user(user)
        AuthService.track_session(user, refresh1, {"ip_address": "127.0.0.1", "user_agent": "Device 1"})
        
        refresh2 = RefreshToken.for_user(user)
        AuthService.track_session(user, refresh2, {"ip_address": "127.0.0.2", "user_agent": "Device 2"})

        # Verify sessions are active initially
        assert UserSession.objects.filter(user=user, is_active=True).count() == 2
        assert OutstandingToken.objects.filter(user=user).count() == 2

        # 2. Perform Logout-all
        AuthService.logout_all(user)

        # 3. Verify all UserSessions for this user are now inactive
        assert UserSession.objects.filter(user=user, is_active=True).count() == 0
        assert UserSession.objects.filter(user=user).count() == 2  # Records should still exist but be inactive

        # 4. Verify all OutstandingTokens for this user are blacklisted
        # Note: SimpleJWT blacklist app moves/marks tokens in BlacklistedToken
        # logout_all implementation uses BlacklistedToken.objects.get_or_create(token=token)
        user_tokens = OutstandingToken.objects.filter(user=user)
        for token in user_tokens:
            assert BlacklistedToken.objects.filter(token=token).exists()

    def test_logout_all_isolation(self, user):
        # 1. Create session for target user
        refresh_target = RefreshToken.for_user(user)
        AuthService.track_session(user, refresh_target, {"ip_address": "127.0.0.1", "user_agent": "Target Device"})

        # 2. Create another user and their session
        other_user = User.objects.create_user(
            email="stay_logged_in@example.com",
            password="password123",
            first_name="Other",
            last_name="User"
        )
        refresh_other = RefreshToken.for_user(other_user)
        AuthService.track_session(other_user, refresh_other, {"ip_address": "127.0.0.3", "user_agent": "Other Device"})

        # 3. Perform Logout-all for target user
        AuthService.logout_all(user)

        # 4. Verify isolation
        assert UserSession.objects.filter(user=user, is_active=True).count() == 0
        assert UserSession.objects.filter(user=other_user, is_active=True).count() == 1
        
        other_token = OutstandingToken.objects.get(user=other_user)
        assert not BlacklistedToken.objects.filter(token=other_token).exists()
