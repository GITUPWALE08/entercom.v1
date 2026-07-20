from django.urls import path

from apps.authentication.views.auth_views import (
    LoginView,
    LogoutAllView,
    LogoutView,
    TokenRefreshView,
    RegisterView,
    VerifyEmailView,
    ChangePasswordView,
    ChangeEmailView,
    RequestPasswordResetView,
    ResetPasswordView,
)

app_name = "authentication"

urlpatterns = [
    path("register/", RegisterView.as_view(), name="register"),
    path("login/", LoginView.as_view(), name="login"),
    path("logout/", LogoutView.as_view(), name="logout"),
    path("logout-all/", LogoutAllView.as_view(), name="logout_all"),
    path("refresh/", TokenRefreshView.as_view(), name="token_refresh"),
    path("verify-email/", VerifyEmailView.as_view(), name="verify_email"),
    path("change-password/", ChangePasswordView.as_view(), name="change_password"),
    path("change-email/", ChangeEmailView.as_view(), name="change_email"),
    path("request-password-reset/", RequestPasswordResetView.as_view(), name="request_password_reset"),
    path("reset-password/", ResetPasswordView.as_view(), name="reset_password"),
]
