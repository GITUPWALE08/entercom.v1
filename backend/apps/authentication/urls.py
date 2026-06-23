from django.urls import path

from apps.authentication.views.auth_views import (
    LoginView,
    LogoutAllView,
    LogoutView,
    TokenRefreshView,
)

app_name = "authentication"

urlpatterns = [
    path("login/", LoginView.as_view(), name="login"),
    path("logout/", LogoutView.as_view(), name="logout"),
    path("logout-all/", LogoutAllView.as_view(), name="logout_all"),
    path("refresh/", TokenRefreshView.as_view(), name="token_refresh"),
]
