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
    archived_at = models.DateTimeField(null=True, blank=True)

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
        QUEUED = 'QUEUED', 'Queued'
        PROCESSING = 'PROCESSING', 'Processing'
        SENT = 'SENT', 'Sent'
        DELIVERED = 'DELIVERED', 'Delivered'
        FAILED = 'FAILED', 'Failed'
        DEAD_LETTERED = 'DEAD_LETTERED', 'Dead Lettered'
        BOUNCED = 'BOUNCED', 'Bounced'

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    notification = models.ForeignKey(Notification, on_delete=models.CASCADE, related_name='deliveries')
    channel = models.CharField(max_length=50, choices=Channel.choices)
    status = models.CharField(max_length=50, choices=Status.choices, default=Status.PENDING)
    retry_count = models.IntegerField(default=0)
    
    # Provider Tracking
    provider_name = models.CharField(max_length=100, blank=True, null=True)
    provider_message_id = models.CharField(max_length=255, blank=True, null=True)
    provider_response = models.JSONField(null=True, blank=True)
    provider_status = models.CharField(max_length=100, blank=True, null=True)
    provider_error_code = models.CharField(max_length=100, blank=True, null=True)
    provider_error_message = models.TextField(blank=True, null=True)
    
    request_timestamp = models.DateTimeField(null=True, blank=True)
    response_timestamp = models.DateTimeField(null=True, blank=True)
    
    idempotency_key = models.CharField(max_length=255, unique=True)
    updated_at = models.DateTimeField(auto_now=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        indexes = [
            models.Index(fields=['status']),
        ]

    def __str__(self):
        return f"{self.channel} Delivery for {self.notification_id}"

class DeliveryRetry(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    delivery = models.ForeignKey(NotificationDelivery, on_delete=models.CASCADE, related_name='retries')
    attempt_number = models.IntegerField()
    reason = models.TextField()
    backoff_delay = models.IntegerField(help_text="Delay in seconds before this retry was attempted")
    outcome = models.CharField(max_length=50) # 'SUCCESS', 'FAILED'
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['created_at']


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


class NotificationTemplate(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    event_type = models.CharField(max_length=255, unique=True)
    subject = models.CharField(max_length=255)
    html_body = models.TextField()
    plain_text_body = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Template for {self.event_type}"

