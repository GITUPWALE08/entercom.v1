from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.authentication.serializers.auth_serializers import (
    LoginSerializer,
    LogoutSerializer,
    RefreshSerializer,
    UserSummarySerializer,
)
from apps.authentication.services.auth_service import AuthService


from apps.authentication.throttling import AuthAnonRateThrottle, AuthUserRateThrottle


class LoginView(APIView):
    permission_classes = [AllowAny]
    throttle_classes = [AuthAnonRateThrottle]

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        request_metadata = {
            "ip_address": self.get_client_ip(request),
            "user_agent": request.META.get("HTTP_USER_AGENT", ""),
        }

        user, refresh = AuthService.login(
            email=serializer.validated_data["email"],
            password=serializer.validated_data["password"],
            request_metadata=request_metadata,
        )

        return Response(
            {
                "user": UserSummarySerializer(user).data,
                "tokens": {
                    "access": str(refresh.access_token),
                    "refresh": str(refresh),
                },
            },
            status=status.HTTP_200_OK,
        )

    def get_client_ip(self, request):
        x_forwarded_for = request.META.get("HTTP_X_FORWARDED_FOR")
        if x_forwarded_for:
            ip = x_forwarded_for.split(",")[0]
        else:
            ip = request.META.get("REMOTE_ADDR")
        return ip


class LogoutView(APIView):
    permission_classes = [IsAuthenticated]
    throttle_classes = [AuthUserRateThrottle]

    def post(self, request):
        serializer = LogoutSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        AuthService.logout(
            refresh_token_str=serializer.validated_data["refresh_token"],
            user=request.user,
        )

        return Response(status=status.HTTP_204_NO_CONTENT)


class LogoutAllView(APIView):
    permission_classes = [IsAuthenticated]
    throttle_classes = [AuthUserRateThrottle]

    def post(self, request):
        AuthService.logout_all(user=request.user)
        return Response(status=status.HTTP_204_NO_CONTENT)


class TokenRefreshView(APIView):
    permission_classes = [AllowAny]
    throttle_classes = [AuthAnonRateThrottle]

    def post(self, request):
        serializer = RefreshSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        request_metadata = {
            "ip_address": self.get_client_ip(request),
            "user_agent": request.META.get("HTTP_USER_AGENT", ""),
        }

        new_token = AuthService.refresh(
            refresh_token_str=serializer.validated_data["refresh"],
            request_metadata=request_metadata,
        )

        return Response(
            {"access": str(new_token.access_token), "refresh": str(new_token)},
            status=status.HTTP_200_OK,
        )

    def get_client_ip(self, request):
        x_forwarded_for = request.META.get("HTTP_X_FORWARDED_FOR")
        if x_forwarded_for:
            ip = x_forwarded_for.split(",")[0]
        else:
            ip = request.META.get("REMOTE_ADDR")
        return ip
