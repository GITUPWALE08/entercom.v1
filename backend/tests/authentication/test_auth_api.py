import pytest
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient
from django.contrib.auth import get_user_model
from apps.authentication.models import UserSession
from django.utils import timezone
from datetime import timedelta

User = get_user_model()

@pytest.mark.django_db
class TestAuthenticationAPI:
    @pytest.fixture
    def api_client(self):
        return APIClient()

    @pytest.fixture
    def user(self):
        return User.objects.create_user(
            email="test@example.com",
            password="testpassword123",
            first_name="Test",
            last_name="User"
        )

    def test_login_success(self, api_client, user):
        url = reverse("authentication:login")
        data = {"email": "test@example.com", "password": "testpassword123"}
        response = api_client.post(url, data, format="json")
        
        assert response.status_code == status.HTTP_200_OK
        assert "tokens" in response.data
        assert "user" in response.data
        assert response.data["user"]["email"] == user.email
        
        # Verify session was created
        assert UserSession.objects.filter(user=user, is_active=True).count() == 1

    def test_login_wrong_password(self, api_client, user):
        url = reverse("authentication:login")
        data = {"email": "test@example.com", "password": "wrongpassword"}
        response = api_client.post(url, data, format="json")
        
        assert response.status_code == status.HTTP_401_UNAUTHORIZED
        
        user.refresh_from_db()
        assert user.failed_login_attempts == 1

    def test_account_lock(self, api_client, user):
        url = reverse("authentication:login")
        data = {"email": "test@example.com", "password": "wrongpassword"}
        
        # 5 failed attempts
        for _ in range(5):
            response = api_client.post(url, data, format="json")
            assert response.status_code == status.HTTP_401_UNAUTHORIZED
        
        user.refresh_from_db()
        assert user.locked_until is not None
        assert user.locked_until > timezone.now()
        
        # Try correct password while locked
        data["password"] = "testpassword123"
        response = api_client.post(url, data, format="json")
        assert response.status_code == status.HTTP_401_UNAUTHORIZED
        assert "locked" in response.data["detail"].lower()

    def test_token_refresh(self, api_client, user):
        # Login first to get refresh token
        login_url = reverse("authentication:login")
        login_data = {"email": "test@example.com", "password": "testpassword123"}
        login_response = api_client.post(login_url, login_data, format="json")
        refresh_token = login_response.data["tokens"]["refresh"]
        
        # Refresh token
        refresh_url = reverse("authentication:token_refresh")
        refresh_data = {"refresh": refresh_token}
        response = api_client.post(refresh_url, refresh_data, format="json")
        
        assert response.status_code == status.HTTP_200_OK
        assert "access" in response.data
        assert "refresh" in response.data
        
        # Verify token rotation (old session inactive, new active)
        # We have 1 login session (now inactive) and 1 refresh session (active)
        assert UserSession.objects.filter(user=user, is_active=True).count() == 1

    def test_logout(self, api_client, user):
        # Login
        login_url = reverse("authentication:login")
        login_data = {"email": "test@example.com", "password": "testpassword123"}
        login_response = api_client.post(login_url, login_data, format="json")
        tokens = login_response.data["tokens"]
        
        # Logout
        logout_url = reverse("authentication:logout")
        api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {tokens['access']}")
        logout_data = {"refresh_token": tokens["refresh"]}
        response = api_client.post(logout_url, logout_data, format="json")
        
        assert response.status_code == status.HTTP_204_NO_CONTENT
        assert UserSession.objects.filter(user=user, is_active=True).count() == 0

    def test_logout_all(self, api_client, user):
        # Create multiple sessions
        login_url = reverse("authentication:login")
        login_data = {"email": "test@example.com", "password": "testpassword123"}
        
        res1 = api_client.post(login_url, login_data, format="json")
        res2 = api_client.post(login_url, login_data, format="json")
        
        assert UserSession.objects.filter(user=user, is_active=True).count() == 2
        
        # Logout all
        logout_all_url = reverse("authentication:logout_all")
        api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {res2.data['tokens']['access']}")
        response = api_client.post(logout_all_url)
        
        assert response.status_code == status.HTTP_204_NO_CONTENT
        assert UserSession.objects.filter(user=user, is_active=True).count() == 0

        # P0: Verify tokens are actually unusable
        refresh_url = reverse("authentication:token_refresh")
        
        # Try refreshing with token 1
        res1_refresh = api_client.post(refresh_url, {"refresh": res1.data["tokens"]["refresh"]}, format="json")
        assert res1_refresh.status_code == status.HTTP_401_UNAUTHORIZED
        
        # Try refreshing with token 2
        res2_refresh = api_client.post(refresh_url, {"refresh": res2.data["tokens"]["refresh"]}, format="json")
        assert res2_refresh.status_code == status.HTTP_401_UNAUTHORIZED

    def test_login_inactive_user(self, api_client, user):
        # P0: Inactive users must not be able to log in
        user.is_active = False
        user.save()
        
        url = reverse("authentication:login")
        data = {"email": "test@example.com", "password": "testpassword123"}
        response = api_client.post(url, data, format="json")
        
        assert response.status_code == status.HTTP_401_UNAUTHORIZED
        assert "inactive" in response.data["detail"].lower()

    def test_refresh_with_inactive_session(self, api_client, user):
        # P0: Refresh must fail if session is marked inactive
        login_url = reverse("authentication:login")
        login_data = {"email": "test@example.com", "password": "testpassword123"}
        login_response = api_client.post(login_url, login_data, format="json")
        refresh_token = login_response.data["tokens"]["refresh"]
        
        # Manually deactivate session
        UserSession.objects.all().update(is_active=False)
        
        refresh_url = reverse("authentication:token_refresh")
        response = api_client.post(refresh_url, {"refresh": refresh_token}, format="json")
        
        assert response.status_code == status.HTTP_401_UNAUTHORIZED
        assert "inactive" in response.data["detail"].lower()

    def test_refresh_with_expired_session_window(self, api_client, user):
        # P0: Refresh must fail if 20-day window expired
        login_url = reverse("authentication:login")
        login_data = {"email": "test@example.com", "password": "testpassword123"}
        login_response = api_client.post(login_url, login_data, format="json")
        refresh_token = login_response.data["tokens"]["refresh"]
        
        # Manually expire session
        UserSession.objects.all().update(expires_at=timezone.now() - timedelta(seconds=1))
        
        refresh_url = reverse("authentication:token_refresh")
        response = api_client.post(refresh_url, {"refresh": refresh_token}, format="json")
        
        assert response.status_code == status.HTTP_401_UNAUTHORIZED
        assert "expired" in response.data["detail"].lower()

    def test_refresh_rotation_and_rolling_window(self, api_client, user):
        # P1: Verify proper rotation and rolling window update
        login_url = reverse("authentication:login")
        login_data = {"email": "test@example.com", "password": "testpassword123"}
        login_response = api_client.post(login_url, login_data, format="json")
        refresh_token = login_response.data["tokens"]["refresh"]
        
        first_session = UserSession.objects.get(is_active=True)
        first_expiry = first_session.expires_at
        
        # Wait a bit or manually shift time if needed, but here we just check if it's new
        refresh_url = reverse("authentication:token_refresh")
        response = api_client.post(refresh_url, {"refresh": refresh_token}, format="json")
        
        assert response.status_code == status.HTTP_200_OK
        
        # Verify old session inactive
        first_session.refresh_from_db()
        assert not first_session.is_active
        
        # Verify new session active with new expiry
        new_session = UserSession.objects.get(is_active=True)
        assert new_session.expires_at > first_expiry
        assert new_session.refresh_jti != first_session.refresh_jti

    def test_throttle_login(self, api_client):
        # P1: Verify throttling on login
        url = reverse("authentication:login")
        data = {"email": "nonexistent@example.com", "password": "password"}
        
        # Auth rate is 30/minute. Let's hit it.
        # Note: Testing throttles in unit tests can be tricky if not cleared.
        for _ in range(30):
            api_client.post(url, data, format="json")
            
        response = api_client.post(url, data, format="json")
        assert response.status_code == status.HTTP_429_TOO_MANY_REQUESTS
