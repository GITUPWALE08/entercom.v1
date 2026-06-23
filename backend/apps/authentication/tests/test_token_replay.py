import pytest
from django.contrib.auth import get_user_model
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework.exceptions import AuthenticationFailed
from apps.authentication.services.auth_service import AuthService
from apps.authentication.models import UserSession
from apps.audit_logs.models import AuditLogEntry
from unittest.mock import patch

User = get_user_model()

@pytest.fixture
def user():
    return User.objects.create_user(
        email="replay_test@example.com",
        password="password123",
        first_name="Replay",
        last_name="Test"
    )

@pytest.mark.django_db(transaction=True)
class TestTokenReplaySecurity:
    """
    Security verification: Refresh tokens must be single-use.
    Replay attempts must be blocked and audited.
    """

    def test_refresh_token_replay_blocked_and_audited(self, user):
        # 1. Initial Login - Generate Refresh Token
        refresh = RefreshToken.for_user(user)
        # Manually inject role_version as AuthService.login would do
        refresh["role_version"] = user.role_version
        
        request_metadata = {"ip_address": "127.0.0.1", "user_agent": "Mozilla/5.0"}
        AuthService.track_session(user, refresh, request_metadata)
        
        token_str = str(refresh)

        # 2. First Use (Valid Refresh)
        new_tokens = AuthService.refresh(token_str, request_metadata)
        assert new_tokens is not None
        assert str(new_tokens) != token_str

        # Verify first session is now inactive
        old_session = UserSession.objects.get(refresh_jti=refresh["jti"])
        assert old_session.is_active is False

        # 3. Second Use (Replay Attack)
        with patch("apps.audit_logs.services.audit_service.security_logger") as mock_security_logger:
            with pytest.raises(AuthenticationFailed) as exc:
                AuthService.refresh(token_str, request_metadata)
            
            # The public error message is normalized for security
            assert "invalid" in str(exc.value).lower() or "expired" in str(exc.value).lower()

            # 4. Verify Database Audit Log
            # The original reason (e.g. 'Token is blacklisted' or 'Session is inactive') 
            # should be in the 'reason' field.
            audit = AuditLogEntry.objects.filter(action="auth.token_refresh_failed").first()
            assert audit is not None
            # It could be 'Token is blacklisted' (SimpleJWT) or 'Session is inactive' (Our check)
            # Both indicate a blocked replay.
            reason = audit.reason.lower()
            assert "blacklisted" in reason or "inactive" in reason or "expired" in reason
            
            # 5. Verify Forensic Stream Emission
            assert mock_security_logger.info.called
            found_replay_log = False
            for call in mock_security_logger.info.call_args_list:
                if "auth.token_refresh_failed" in str(call.args[0]):
                    found_replay_log = True
                    break
            assert found_replay_log, "Forensic log for token replay attempt missing"

    def test_token_replay_with_blacklisting(self, user):
        """
        Verify that SimpleJWT's internal blacklisting also triggers audit.
        """
        refresh = RefreshToken.for_user(user)
        refresh["role_version"] = user.role_version
        AuthService.track_session(user, refresh, {"ip_address": "127.0.0.1"})
        
        token_str = str(refresh)
        
        # Manually blacklist it
        refresh.blacklist()
        
        # Attempt to use blacklisted token
        with pytest.raises(AuthenticationFailed):
            AuthService.refresh(token_str, {"ip_address": "127.0.0.1"})
            
        # Verify it was audited as a failure
        assert AuditLogEntry.objects.filter(action="auth.token_refresh_failed").exists()
