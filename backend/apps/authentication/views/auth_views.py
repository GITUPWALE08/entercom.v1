from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.authentication.serializers.auth_serializers import (
    LoginSerializer,
    LogoutSerializer,
    RefreshSerializer,
    RegisterSerializer,
    UserSummarySerializer,
    VerifyEmailSerializer,
    ChangePasswordSerializer,
    ChangeEmailSerializer,
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

class RegisterView(APIView):
    permission_classes = [AllowAny]
    throttle_classes = [AuthAnonRateThrottle]

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        request_metadata = {
            "ip_address": self.get_client_ip(request),
            "user_agent": request.META.get("HTTP_USER_AGENT", ""),
        }

        user, refresh = AuthService.register(
            data=serializer.validated_data,
            request_metadata=request_metadata,
        )

        return Response(
            {
                "user": UserSummarySerializer(user).data,
                "message": "Registration successful. Please verify your email.",
            },
            status=status.HTTP_201_CREATED,
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

class VerifyEmailView(APIView):
    permission_classes = [AllowAny]
    throttle_classes = [AuthAnonRateThrottle]

    def post(self, request):
        serializer = VerifyEmailSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        AuthService.verify_email(token=serializer.validated_data["token"])
        return Response({"detail": "Email verified successfully."}, status=status.HTTP_200_OK)

class ChangePasswordView(APIView):
    permission_classes = [IsAuthenticated]
    throttle_classes = [AuthUserRateThrottle]

    def post(self, request):
        serializer = ChangePasswordSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        AuthService.change_password(
            user=request.user,
            old_password=serializer.validated_data["old_password"],
            new_password=serializer.validated_data["new_password"]
        )
        return Response({"detail": "Password changed successfully."}, status=status.HTTP_200_OK)

class ChangeEmailView(APIView):
    permission_classes = [IsAuthenticated]
    throttle_classes = [AuthUserRateThrottle]

    def post(self, request):
        serializer = ChangeEmailSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        AuthService.change_email(
            user=request.user,
            new_email=serializer.validated_data["new_email"]
        )
        return Response({"detail": "Email changed successfully. Please verify your new email."}, status=status.HTTP_200_OK)

class RequestPasswordResetView(APIView):
    permission_classes = [AllowAny]
    throttle_classes = [AuthAnonRateThrottle]

    def post(self, request):
        from apps.authentication.serializers.auth_serializers import RequestPasswordResetSerializer
        serializer = RequestPasswordResetSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        AuthService.request_password_reset(email=serializer.validated_data["email"])
        return Response({"detail": "If the email exists, a password reset OTP has been sent."}, status=status.HTTP_200_OK)

class ResetPasswordView(APIView):
    permission_classes = [AllowAny]
    throttle_classes = [AuthAnonRateThrottle]

    def post(self, request):
        from apps.authentication.serializers.auth_serializers import ResetPasswordSerializer
        serializer = ResetPasswordSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        AuthService.complete_password_reset(
            email=serializer.validated_data["email"],
            token=serializer.validated_data["otp"],
            new_password=serializer.validated_data["new_password"]
        )
        return Response({"detail": "Password has been reset successfully."}, status=status.HTTP_200_OK)
