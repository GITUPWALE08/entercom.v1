import uuid
from django.db import models
from django.conf import settings

class Notification(models.Model):
    class Status(models.TextChoices):
        UNREAD = 'UNREAD', 'Unread'
        READ = 'READ', 'Read'
        ARCHIVED = 'ARCHIVED', 'Archived'

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    recipient = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='notifications')
    category = models.CharField(max_length=255)
    event_type = models.CharField(max_length=255)
    title = models.CharField(max_length=255)
    message = models.TextField()
    context = models.JSONField(default=dict, blank=True)
    resource_type = models.CharField(max_length=255, blank=True, null=True)
    resource_id = models.CharField(max_length=255, blank=True, null=True)
    status = models.CharField(max_length=50, choices=Status.choices, default=Status.UNREAD)
    created_at = models.DateTimeField(auto_now_add=True)
    read_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        indexes = [
            models.Index(fields=['recipient', 'status', 'created_at']),
            models.Index(fields=['resource_type', 'resource_id']),
        ]

    def __str__(self):
        return f"Notification {self.id} to {self.recipient_id}"


class NotificationDelivery(models.Model):
    class Channel(models.TextChoices):
        IN_APP = 'IN_APP', 'In-App'
        EMAIL = 'EMAIL', 'Email'
        PUSH = 'PUSH', 'Push'
        WEBSOCKET = 'WEBSOCKET', 'WebSocket'

    class Status(models.TextChoices):
        PENDING = 'PENDING', 'Pending'
        PROCESSING = 'PROCESSING', 'Processing'
        SENT = 'SENT', 'Sent'
        FAILED = 'FAILED', 'Failed'
        DEAD_LETTERED = 'DEAD_LETTERED', 'Dead Lettered'

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    notification = models.ForeignKey(Notification, on_delete=models.CASCADE, related_name='deliveries')
    channel = models.CharField(max_length=50, choices=Channel.choices)
    status = models.CharField(max_length=50, choices=Status.choices, default=Status.PENDING)
    retry_count = models.IntegerField(default=0)
    provider_response = models.JSONField(null=True, blank=True)
    idempotency_key = models.CharField(max_length=255, unique=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        indexes = [
            models.Index(fields=['status']),
        ]

    def __str__(self):
        return f"{self.channel} Delivery for {self.notification_id}"


class NotificationPreference(models.Model):
    class Channel(models.TextChoices):
        EMAIL = 'EMAIL', 'Email'
        PUSH = 'PUSH', 'Push'

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='notification_preferences')
    category = models.CharField(max_length=255)
    channel = models.CharField(max_length=50, choices=Channel.choices)
    is_enabled = models.BooleanField(default=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=['user', 'category', 'channel'], name='unique_user_category_channel_preference')
        ]
        indexes = [
            models.Index(fields=['user']),
        ]

    def __str__(self):
        return f"Preference {self.category}/{self.channel} for {self.user_id}"
