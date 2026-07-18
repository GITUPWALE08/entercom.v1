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
            
        # Enqueue delivery tasks
        from apps.notification.tasks import task_dispatch_email, task_dispatch_push
        for delivery in deliveries:
            if delivery.channel == NotificationDelivery.Channel.EMAIL:
                transaction.on_commit(lambda d=delivery: task_dispatch_email.delay(d.id))
            elif delivery.channel == NotificationDelivery.Channel.PUSH:
                transaction.on_commit(lambda d=delivery: task_dispatch_push.delay(d.id))
                
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
            notification.archived_at = timezone.now()
            notification.save(update_fields=['status', 'archived_at'])
        return notification

    @staticmethod
    def dispatch_email_delivery(delivery):
        from django.template.loader import render_to_string
        from django.template import TemplateDoesNotExist
        from .providers import ProviderFactory

        notification = delivery.notification
        recipient = notification.recipient
        if not recipient.email:
            raise ValueError("Recipient has no email address configured")
            
        event_type_slug = str(notification.event_type).replace('.', '_').lower()
        html_template_path = f"email/{event_type_slug}.html"
        text_template_path = f"email/{event_type_slug}.txt"
        
        context = notification.context or {}
        context['user'] = recipient
        context['notification'] = notification

        try:
            html_body = render_to_string(html_template_path, context)
        except TemplateDoesNotExist:
            html_body = f"<p>{notification.message}</p>"
            
        try:
            text_body = render_to_string(text_template_path, context)
        except TemplateDoesNotExist:
            text_body = notification.message

        provider = ProviderFactory.get_provider()
        return provider.send_email(
            to_email=recipient.email,
            subject=notification.title,
            html_body=html_body,
            plain_text_body=text_body
        )


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
    def classify_and_handle_failure(delivery_id, exception_msg, is_transient, provider_name=None, error_code=None):
        from .models import DeliveryRetry
        delivery = NotificationDelivery.objects.get(id=delivery_id)
        delivery.provider_response = {'error': exception_msg}
        delivery.provider_error_message = exception_msg
        
        if provider_name:
            delivery.provider_name = provider_name
        if error_code:
            delivery.provider_error_code = error_code
            
        if is_transient:
            delivery.status = NotificationDelivery.Status.FAILED
            DeliveryRetry.objects.create(
                delivery=delivery,
                attempt_number=delivery.retry_count + 1,
                reason=exception_msg,
                backoff_delay=0, # Computed by Celery
                outcome='FAILED'
            )
        else:
            delivery.status = NotificationDelivery.Status.DEAD_LETTERED
            
        delivery.save(update_fields=['status', 'provider_response', 'provider_name', 'provider_error_message', 'provider_error_code', 'updated_at'])
        
        from apps.audit_logs.services.audit_service import log_action
        log_action(
            action="notification.provider_failure",
            resource_type="delivery",
            resource_id=str(delivery.id),
            reason=exception_msg,
            metadata={"transient": is_transient}
        )
        return delivery
