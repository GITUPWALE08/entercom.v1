import pytest
from django.contrib.auth import get_user_model
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework.exceptions import AuthenticationFailed
from apps.authentication.authentication import CustomJWTAuthentication

User = get_user_model()

@pytest.mark.django_db
def test_custom_jwt_authentication_valid_token():
    user = User.objects.create_user(email="test@test.com", password="pwd", first_name="A", last_name="B")
    refresh = RefreshToken.for_user(user)
    refresh["role_version"] = user.role_version
    
    auth = CustomJWTAuthentication()
    validated_user = auth.get_user(refresh.access_token)
    assert validated_user.id == user.id

@pytest.mark.django_db
def test_custom_jwt_authentication_invalid_role_version():
    user = User.objects.create_user(email="test@test.com", password="pwd", first_name="A", last_name="B")
    refresh = RefreshToken.for_user(user)
    refresh["role_version"] = user.role_version
    
    # Simulate role version change
    user.role_version += 1
    user.save()
    
    auth = CustomJWTAuthentication()
    with pytest.raises(AuthenticationFailed, match="Token has been invalidated"):
        auth.get_user(refresh.access_token)
