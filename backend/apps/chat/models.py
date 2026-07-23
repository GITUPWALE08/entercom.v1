import uuid
from django.db import models
from django.conf import settings

class ConversationStatus(models.TextChoices):
    OPEN = 'open', 'Open'
    RESOLVED = 'resolved', 'Resolved'
    CLOSED = 'closed', 'Closed'

class ConversationType(models.TextChoices):
    SUPPORT = 'support', 'Support'
    REQUEST = 'request', 'Request'
    BOOKING = 'booking', 'Booking'
    PAYMENT = 'payment', 'Payment'

class MessageType(models.TextChoices):
    TEXT = 'text', 'Text'
    SYSTEM = 'system', 'System'
    INTERNAL_NOTE = 'internal_note', 'Internal Note'

class Conversation(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    public_id = models.CharField(max_length=50, unique=True, blank=True)
    subject = models.CharField(max_length=255)
    status = models.CharField(max_length=20, choices=ConversationStatus.choices, default=ConversationStatus.OPEN)
    conversation_type = models.CharField(max_length=20, choices=ConversationType.choices, default=ConversationType.SUPPORT)
    
    # Optional links
    request = models.ForeignKey('requests.Request', on_delete=models.SET_NULL, null=True, blank=True, related_name='conversations')
    booking = models.ForeignKey('bookings.Booking', on_delete=models.SET_NULL, null=True, blank=True, related_name='conversations')
    payment = models.ForeignKey('payments.Payment', on_delete=models.SET_NULL, null=True, blank=True, related_name='conversations')
    
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='created_conversations')
    assigned_staff = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name='assigned_conversations')
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    resolved_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ['-updated_at']

    def save(self, *args, **kwargs):
        if not self.public_id:
            # Generate a simple public ID prefixing CHAT-
            self.public_id = f"CHAT-{str(uuid.uuid4())[:8].upper()}"
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.public_id} - {self.subject}"


class ConversationParticipant(models.Model):
    conversation = models.ForeignKey(Conversation, on_delete=models.CASCADE, related_name='participants')
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='chat_participations')
    joined_at = models.DateTimeField(auto_now_add=True)
    last_read_at = models.DateTimeField(auto_now_add=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        unique_together = ('conversation', 'user')
        ordering = ['joined_at']


class Message(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    conversation = models.ForeignKey(Conversation, on_delete=models.CASCADE, related_name='messages')
    sender = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name='sent_messages')
    body = models.TextField(max_length=5000)
    message_type = models.CharField(max_length=20, choices=MessageType.choices, default=MessageType.TEXT)
    
    created_at = models.DateTimeField(auto_now_add=True)
    edited_at = models.DateTimeField(null=True, blank=True)
    delivered_at = models.DateTimeField(null=True, blank=True)
    read_at = models.DateTimeField(null=True, blank=True)
    is_deleted = models.BooleanField(default=False)

    class Meta:
        ordering = ['created_at']

class Attachment(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    message = models.ForeignKey(Message, on_delete=models.CASCADE, related_name='attachments')
    file = models.FileField(upload_to='chat_attachments/%Y/%m/%d/')
    file_name = models.CharField(max_length=255)
    file_type = models.CharField(max_length=100)
    file_size = models.PositiveIntegerField()
    created_at = models.DateTimeField(auto_now_add=True)

class ConversationTransfer(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    conversation = models.ForeignKey(Conversation, on_delete=models.CASCADE, related_name='transfers')
    previous_staff = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name='transfers_from')
    new_staff = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name='transfers_to')
    transferred_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name='transfers_initiated')
    reason = models.TextField(blank=True)
    transferred_at = models.DateTimeField(auto_now_add=True)
