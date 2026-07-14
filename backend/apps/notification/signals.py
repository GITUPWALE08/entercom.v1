from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import Notification
from apps.websocket.publisher import EventPublisher

@receiver(post_save, sender=Notification)
def notification_created(sender, instance, created, **kwargs):
    if created:
        # Format payload strictly stripping internal states not meant for UI
        payload = {
            "id": str(instance.id),
            "category": instance.category,
            "event_type": instance.event_type,
            "title": instance.title,
            "message": instance.message,
            "resource_type": instance.resource_type,
            "resource_id": instance.resource_id,
            "created_at": instance.created_at.isoformat(),
            "status": instance.status
        }
        
        # Channel name targeting the specific user
        channel_name = f"user.{instance.recipient_id}.notifications"
        
        EventPublisher.publish_to_channel(channel_name, payload)
