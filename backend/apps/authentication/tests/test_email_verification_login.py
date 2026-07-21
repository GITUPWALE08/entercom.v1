import pytest
from django.contrib.auth import get_user_model
from rest_framework.exceptions import AuthenticationFailed
from apps.authentication.services.auth_service import AuthService

User = get_user_model()

@pytest.mark.django_db
def test_login_unverified_email_fails():
    user = User.objects.create_user(email="unverified@test.com", password="pwd", first_name="A", last_name="B", is_active=True)
    user.email_verified = False
    user.save()
    with pytest.raises(AuthenticationFailed, match="Email address has not been verified"):
        AuthService.login("unverified@test.com", "pwd", {})

@pytest.mark.django_db
def test_login_verified_email_succeeds():
    user = User.objects.create_user(email="verified@test.com", password="pwd", first_name="A", last_name="B", is_active=True)
    user.email_verified = True
    user.save()
    logged_in_user, token = AuthService.login("verified@test.com", "pwd", {})
    assert logged_in_user.id == user.id
