from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.exceptions import AuthenticationFailed
from django.utils.translation import gettext_lazy as _

class CustomJWTAuthentication(JWTAuthentication):
    def get_user(self, validated_token):
        user = super().get_user(validated_token)
        
        token_role_version = validated_token.get("role_version")
        if token_role_version is not None and token_role_version != user.role_version:
            raise AuthenticationFailed(
                _("Token has been invalidated. Please log in again."),
                code="token_invalidated",
            )
            
        return user
