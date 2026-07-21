from __future__ import annotations

import logging
from datetime import timedelta
from typing import Any

from django.contrib.auth import get_user_model
from django.contrib.auth.tokens import default_token_generator
from django.utils import timezone
from django.utils.encoding import force_bytes
from django.utils.http import urlsafe_base64_encode
from rest_framework.exceptions import AuthenticationFailed
from rest_framework_simplejwt.token_blacklist.models import BlacklistedToken, OutstandingToken
from rest_framework_simplejwt.tokens import RefreshToken

import secrets
from apps.audit_logs.services.audit_service import log_action
from apps.authentication.models import UserSession, EmailVerificationToken, PasswordResetToken
from apps.notification.services import DispatchOrchestrator

User = get_user_model()
logger = logging.getLogger(__name__)


class AuthService:
    """Business logic for JWT authentication, session tracking, and account locking."""

    SESSION_INACTIVITY_DAYS = 20

    @staticmethod
    def register(data: dict[str, Any], request_metadata: dict[str, Any]) -> tuple[User, None]:
        email = data["email"]
        if User.objects.filter(email=email).exists():
            raise AuthenticationFailed("User with this email already exists")

        user = User.objects.create_user(
            email=email,
            password=data["password"],
            first_name=data.get("first_name", ""),
            last_name=data.get("last_name", ""),
            phone_number=data.get("phone_number", ""),
            email_verified=False,
        )

        log_action(
            actor=user,
            action="auth.register_success",
            resource_type="user",
            resource_id=str(user.id),
        )

        otp = f"{secrets.randbelow(1000000):06d}"
        EmailVerificationToken.objects.create(user=user, token=otp)

        from apps.notification.providers import ProviderFactory
        provider = ProviderFactory.get_provider()
        html_body = f"<p>Hello {user.first_name},</p><p>Please verify your email using this 6-digit OTP: <strong>{otp}</strong></p>"
        text_body = f"Hello {user.first_name},\n\nPlease verify your email using this 6-digit OTP: {otp}"
        
        provider.send_email(
            to_email=user.email,
            subject="Verify Your Email Address",
            html_body=html_body,
            plain_text_body=text_body
        )

        return user, None

    @staticmethod
    def login(email: str, password: str, request_metadata: dict[str, Any]) -> tuple[User, RefreshToken]:
        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            log_action(
                action="auth.login_failed",
                resource_type="user",
                resource_id=email,
                reason="User not found",
                metadata={"email": email},
            )
            raise AuthenticationFailed("Invalid email or password")
        
        if not user.check_password(password):
            user.failed_login_attempts += 1
            if user.failed_login_attempts >= 5:
                AuthService.lock_account(user)
                raise AuthenticationFailed("Account locked due to too many failed attempts")

            user.save()
            log_action(
                actor=user,
                action="auth.login_failed",
                resource_type="user",
                resource_id=str(user.id),
                reason="Invalid password",
                metadata={"attempts": user.failed_login_attempts},
            )
            raise AuthenticationFailed("Invalid email or password")

        if not user.is_active:
            log_action(
                actor=user,
                action="auth.login_failed",
                resource_type="user",
                resource_id=str(user.id),
                reason="Account inactive",
            )
            raise AuthenticationFailed("Account is inactive")

        if not user.email_verified:
            log_action(
                actor=user,
                action="auth.login_failed",
                resource_type="user",
                resource_id=str(user.id),
                reason="Email not verified",
            )
            raise AuthenticationFailed("Email address has not been verified.")

        if user.locked_until and user.locked_until > timezone.now():
            log_action(
                actor=user,
                action="auth.login_failed",
                resource_type="user",
                resource_id=str(user.id),
                reason="Account locked",
                metadata={"locked_until": user.locked_until.isoformat()},
            )
            raise AuthenticationFailed(f"Account is locked until {user.locked_until}")

        user.failed_login_attempts = 0
        user.locked_until = None
        user.last_login = timezone.now()
        user.last_login_ip = request_metadata.get("ip_address")
        user.save()

        refresh = RefreshToken.for_user(user)
        refresh["role_version"] = user.role_version
        refresh.access_token["role_version"] = user.role_version
        AuthService.track_session(user, refresh, request_metadata)

        log_action(
            actor=user,
            action="auth.login_success",
            resource_type="user",
            resource_id=str(user.id),
        )

        return user, refresh

    @staticmethod
    def logout(refresh_token_str: str, user: User | None = None) -> None:
        try:
            token = RefreshToken(refresh_token_str)
            jti = token["jti"]
            token.blacklist()
            UserSession.objects.filter(refresh_jti=jti).update(is_active=False)

            log_action(
                actor=user,
                action="auth.logout",
                resource_type="user",
                resource_id=str(user.id) if user else "unknown",
                metadata={"jti": str(jti)},
            )
        except Exception as exc:
            log_action(
                actor=user,
                action="auth.logout_failed",
                resource_type="user",
                resource_id=str(user.id) if user else "unknown",
                reason=str(exc),
            )
            raise AuthenticationFailed("Invalid or expired refresh token") from exc

    @staticmethod
    def logout_all(user: User) -> None:
        tokens = OutstandingToken.objects.filter(user=user)
        for token in tokens:
            BlacklistedToken.objects.get_or_create(token=token)

        UserSession.objects.filter(user=user).update(is_active=False)

        log_action(
            actor=user,
            action="auth.logout_all",
            resource_type="user",
            resource_id=str(user.id),
            metadata={"count": tokens.count()},
        )

    @staticmethod
    def refresh(refresh_token_str: str, request_metadata: dict[str, Any]) -> RefreshToken:
        try:
            old_token = RefreshToken(refresh_token_str)
            old_jti = old_token["jti"]

            try:
                session = UserSession.objects.get(refresh_jti=old_jti)
                if not session.is_active:
                    raise AuthenticationFailed("Session is inactive")
                if session.expires_at < timezone.now():
                    session.is_active = False
                    session.save()
                    raise AuthenticationFailed("Session has expired due to inactivity")
            except UserSession.DoesNotExist:
                raise AuthenticationFailed("Session tracking not found for token")

            user_id = old_token["user_id"]
            user = User.objects.get(id=user_id)

            if not user.is_active:
                raise AuthenticationFailed("User account is inactive")

            session.is_active = False
            session.save()
            old_token.blacklist()

            if old_token["role_version"] != user.role_version:
                raise AuthenticationFailed("Permissions changed. Login again.")

            new_token = RefreshToken.for_user(user)
            new_token["role_version"] = user.role_version
            new_token.access_token["role_version"] = user.role_version
            AuthService.track_session(user, new_token, request_metadata)

            log_action(
                actor=user,
                action="auth.token_refresh",
                resource_type="user",
                resource_id=str(user.id),
                metadata={"old_jti": str(old_jti), "new_jti": str(new_token["jti"])},
            )

            return new_token
        except AuthenticationFailed as exc:
            log_action(
                action="auth.token_refresh_failed",
                resource_type="user",
                reason=str(exc),
                metadata={"error": type(exc).__name__},
            )
            raise
        except Exception as exc:
            log_action(
                action="auth.token_refresh_failed",
                resource_type="user",
                reason=str(exc),
                metadata={"error": type(exc).__name__},
            )
            raise AuthenticationFailed("Invalid or expired refresh token") from exc

    @staticmethod
    def request_password_reset(email: str) -> None:
        """Always completes without revealing whether the account exists."""
        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            log_action(
                action="auth.password_reset_requested",
                resource_type="user",
                resource_id=email,
                reason="Reset requested",
                metadata={"email": email, "account_exists": False},
            )
            return

        otp = f"{secrets.randbelow(1000000):06d}"
        # Invalidate old unused tokens
        PasswordResetToken.objects.filter(user=user, is_used=False).update(is_used=True)
        PasswordResetToken.objects.create(user=user, token=otp)

        log_action(
            actor=user,
            action="auth.password_reset_requested",
            resource_type="user",
            resource_id=str(user.id),
            metadata={"token_issued": True},
        )

        from apps.notification.providers import ProviderFactory
        provider = ProviderFactory.get_provider()
        html_body = f"<p>Hello {user.first_name},</p><p>You requested a password reset. Use this 6-digit OTP: <strong>{otp}</strong></p>"
        text_body = f"Hello {user.first_name},\n\nYou requested a password reset. Use this 6-digit OTP: {otp}"
        
        provider.send_email(
            to_email=user.email,
            subject="Password Reset OTP",
            html_body=html_body,
            plain_text_body=text_body
        )

    @staticmethod
    def complete_password_reset(
        *, email: str, token: str, new_password: str
    ) -> User:
        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            log_action(
                action="auth.password_reset_failed",
                resource_type="user",
                resource_id=email,
                reason="User not found",
            )
            raise AuthenticationFailed("Invalid password reset request")

        try:
            reset_token = PasswordResetToken.objects.get(user=user, token=token, is_used=False)
        except PasswordResetToken.DoesNotExist:
            log_action(
                actor=user,
                action="auth.password_reset_failed",
                resource_type="user",
                resource_id=str(user.id),
                reason="Invalid token",
            )
            raise AuthenticationFailed("Invalid or expired password reset token")

        if not reset_token.is_valid():
            log_action(
                actor=user,
                action="auth.password_reset_failed",
                resource_type="user",
                resource_id=str(user.id),
                reason="Expired token",
            )
            raise AuthenticationFailed("Invalid or expired password reset token")

        reset_token.is_used = True
        reset_token.save(update_fields=['is_used'])

        user.set_password(new_password)
        user.last_password_change_at = timezone.now()
        user.save()

        log_action(
            actor=user,
            action="auth.password_reset_completed",
            resource_type="user",
            resource_id=str(user.id),
        )
        
        DispatchOrchestrator.dispatch_event(
            event_type="password_reset_completed",
            recipient_id=user.id,
            context={"first_name": user.first_name},
            resource_type="user",
            resource_id=str(user.id),
            category="alerts",
            title="Password Reset Successful",
            message="Your password has been reset successfully.",
            is_system_critical=True
        )
        
        revoke_all_sessions(user)

        return user

    @staticmethod
    def lock_account(user: User) -> None:
        user.locked_until = timezone.now() + timedelta(hours=24)
        user.save()

        log_action(
            actor=user,
            action="auth.account_locked",
            resource_type="user",
            resource_id=str(user.id),
            reason="Too many failed attempts",
        )

        DispatchOrchestrator.dispatch_event(
            event_type="account_locked",
            recipient_id=user.id,
            context={"first_name": user.first_name, "locked_until": user.locked_until.strftime("%Y-%m-%d %H:%M:%S")},
            resource_type="user",
            resource_id=str(user.id),
            category="alerts",
            title="Account Locked",
            message=f"Your account has been temporarily locked until {user.locked_until.strftime('%Y-%m-%d %H:%M:%S')}.",
            is_system_critical=True
        )

    @staticmethod
    def verify_email(token: str) -> User:
        try:
            verification_token = EmailVerificationToken.objects.get(token=token)
        except EmailVerificationToken.DoesNotExist:
            raise AuthenticationFailed("Invalid verification token")

        if not verification_token.is_valid():
            verification_token.delete()
            raise AuthenticationFailed("Verification token expired")

        user = verification_token.user
        user.email_verified = True
        user.save(update_fields=['email_verified'])

        verification_token.delete()

        log_action(
            actor=user,
            action="auth.email_verified",
            resource_type="user",
            resource_id=str(user.id),
        )

        DispatchOrchestrator.dispatch_event(
            event_type="welcome",
            recipient_id=user.id,
            context={"first_name": user.first_name},
            resource_type="user",
            resource_id=str(user.id),
            category="updates",
            title="Welcome to Entercom",
            message="Your account has been created and verified successfully.",
            is_system_critical=False
        )

        return user

    @staticmethod
    def change_password(user: User, old_password: str, new_password: str) -> None:
        if not user.check_password(old_password):
            raise AuthenticationFailed("Incorrect old password")

        user.set_password(new_password)
        user.last_password_change_at = timezone.now()
        user.save()

        revoke_all_sessions(user)

        log_action(
            actor=user,
            action="auth.password_changed",
            resource_type="user",
            resource_id=str(user.id),
        )

        # [DEFERRED] Non-MVP event
        # DispatchOrchestrator.dispatch_event(
        #     event_type="password_changed",
        #     recipient_id=user.id,
        #     context={"first_name": user.first_name},
        #     resource_type="user",
        #     resource_id=str(user.id),
        #     category="alerts",
        #     title="Password Changed Notification",
        #     message="Your password was successfully changed.",
        #     is_system_critical=True
        # )

    @staticmethod
    def change_email(user: User, new_email: str) -> None:
        if User.objects.filter(email=new_email).exists():
            raise AuthenticationFailed("Email is already in use")

        old_email = user.email
        user.email = new_email
        user.email_verified = False
        user.save(update_fields=['email', 'email_verified'])

        log_action(
            actor=user,
            action="auth.email_changed",
            resource_type="user",
            resource_id=str(user.id),
            metadata={"old_email": old_email, "new_email": new_email}
        )

        # Notify old email (which currently requires recipient_id=user.id, but our system sends to user.email.
        # Wait, if we send to recipient_id, it looks up the user's CURRENT email. So it will send to the NEW email.
        # This complies with "Email changed notification" sent to the user profile.
        # [DEFERRED] Non-MVP event
        # DispatchOrchestrator.dispatch_event(
        #     event_type="email_changed",
        #     recipient_id=user.id,
        #     context={"first_name": user.first_name, "old_email": old_email, "new_email": new_email},
        #     resource_type="user",
        #     resource_id=str(user.id),
        #     category="alerts",
        #     title="Email Address Changed",
        #     message=f"Your email was changed from {old_email} to {new_email}.",
        #     is_system_critical=True
        # )

        # Generate new verification token
        otp = f"{secrets.randbelow(1000000):06d}"
        EmailVerificationToken.objects.create(user=user, token=otp)
        
        from apps.notification.providers import ProviderFactory
        provider = ProviderFactory.get_provider()
        html_body = f"<p>Hello {user.first_name},</p><p>Please verify your new email using this 6-digit OTP: <strong>{otp}</strong></p>"
        text_body = f"Hello {user.first_name},\n\nPlease verify your new email using this 6-digit OTP: {otp}"
        
        provider.send_email(
            to_email=user.email,
            subject="Verify Your New Email Address",
            html_body=html_body,
            plain_text_body=text_body
        )


    @staticmethod
    def track_session(
        user: User, refresh_token: RefreshToken, request_metadata: dict[str, Any]
    ) -> UserSession:
        jti = refresh_token["jti"]
        now = timezone.now()
        expires_at = now + timedelta(days=AuthService.SESSION_INACTIVITY_DAYS)

        ua = request_metadata.get("user_agent", "")
        browser = "Unknown"
        device = "Unknown"

        if "Chrome" in ua:
            browser = "Chrome"
        elif "Firefox" in ua:
            browser = "Firefox"
        elif "Safari" in ua:
            browser = "Safari"
        elif "Edge" in ua:
            browser = "Edge"

        if "Mobile" in ua:
            device = "Mobile"
        elif "iPhone" in ua:
            device = "iPhone"
        elif "Android" in ua:
            device = "Android"
        else:
            device = "Desktop"

        return UserSession.objects.create(
            user=user,
            refresh_jti=jti,
            device_name=device,
            browser=browser,
            ip_address=request_metadata.get("ip_address"),
            expires_at=expires_at,
        )


def revoke_all_sessions(user):
    UserSession.objects.filter(
        user=user,
        is_active=True
    ).update(is_active=False)

    OutstandingToken.objects.filter(
        user=user
    ).delete()