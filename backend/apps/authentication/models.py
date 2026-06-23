from django.conf import settings
from django.db import models


class UserSession(models.Model):
    """Tracks active refresh tokens and device metadata for security auditing."""

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="sessions",
    )
    refresh_jti = models.UUIDField(unique=True, db_index=True)
    device_name = models.CharField(max_length=255, blank=True, default="")
    browser = models.CharField(max_length=255, blank=True, default="")
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    last_activity = models.DateTimeField(auto_now=True)
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField(db_index=True)
    is_active = models.BooleanField(default=True, db_index=True)

    class Meta:
        db_table = "auth_user_session"
        ordering = ("-last_activity",)

    def __str__(self) -> str:
        return f"{self.user.email} - {self.device_name or 'Unknown Device'}"
