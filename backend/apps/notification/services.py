from django.db import transaction
from django.utils import timezone
from .models import Notification, NotificationDelivery, NotificationPreference

class PreferenceResolver:
    @staticmethod
    def resolve_channels(user_id, category, is_system_critical=False):
        if is_system_critical:
            # System critical always gets IN_APP and EMAIL
            return [NotificationDelivery.Channel.IN_APP, NotificationDelivery.Channel.EMAIL]
        
        # IN_APP is always included
        channels = {NotificationDelivery.Channel.IN_APP}
        
        # Fetch user preferences
        preferences = NotificationPreference.objects.filter(user_id=user_id, category=category)
        prefs_dict = {p.channel: p.is_enabled for p in preferences}
        
        # Default global could be True for EMAIL and PUSH
        if prefs_dict.get(NotificationDelivery.Channel.EMAIL, True):
            channels.add(NotificationDelivery.Channel.EMAIL)
        
        if prefs_dict.get(NotificationDelivery.Channel.PUSH, True):
            channels.add(NotificationDelivery.Channel.PUSH)
            
        return list(channels)


class DispatchOrchestrator:
    @staticmethod
    @transaction.atomic
    def dispatch_event(event_type, recipient_id, context, resource_type, resource_id, category, title, message, is_system_critical=False):
        # 1. Resolve preferences
        channels = PreferenceResolver.resolve_channels(recipient_id, category, is_system_critical)
        
        # 2. Create Notification
        notification = Notification.objects.create(
            recipient_id=recipient_id,
            category=category,
            event_type=event_type,
            title=title,
            message=message,
            context=context,
            resource_type=resource_type,
            resource_id=resource_id
        )
        
        # 3. Create Delivery attempts
        deliveries = []
        for channel in channels:
            # Generate idempotency key
            idemp_key = f"{notification.id}_{recipient_id}_{channel}"
            delivery = NotificationDelivery.objects.create(
                notification=notification,
                channel=channel,
                status=NotificationDelivery.Status.PENDING,
                idempotency_key=idemp_key
            )
            deliveries.append(delivery)
            
        # Note: Celery enqueueing is explicitly out of scope for Stage 2.
        return notification, deliveries


class NotificationService:
    @staticmethod
    def mark_as_read(notification_id, user_id):
        notification = Notification.objects.get(id=notification_id, recipient_id=user_id)
        if notification.status == Notification.Status.UNREAD:
            notification.status = Notification.Status.READ
            notification.read_at = timezone.now()
            notification.save(update_fields=['status', 'read_at'])
        return notification

    @staticmethod
    def archive_notification(notification_id, user_id):
        notification = Notification.objects.get(id=notification_id, recipient_id=user_id)
        if notification.status != Notification.Status.ARCHIVED:
            notification.status = Notification.Status.ARCHIVED
            notification.save(update_fields=['status'])
        return notification


class DeliveryMonitor:
    @staticmethod
    def update_delivery_status(delivery_id, status, provider_response=None):
        delivery = NotificationDelivery.objects.get(id=delivery_id)
        delivery.status = status
        if provider_response:
            delivery.provider_response = provider_response
        delivery.save(update_fields=['status', 'provider_response', 'updated_at'])
        return delivery


class FailureRecoveryService:
    @staticmethod
    def classify_and_handle_failure(delivery_id, exception_msg, is_transient):
        delivery = NotificationDelivery.objects.get(id=delivery_id)
        delivery.provider_response = {'error': exception_msg}
        if is_transient:
            delivery.status = NotificationDelivery.Status.FAILED
        else:
            delivery.status = NotificationDelivery.Status.DEAD_LETTERED
            
        delivery.save(update_fields=['status', 'provider_response', 'updated_at'])
        return delivery
