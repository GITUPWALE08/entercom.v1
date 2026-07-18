from django.db.models import Count, Avg
from django.utils import timezone
from apps.notification.models import NotificationDelivery
from apps.notification.tasks import task_dispatch_email, task_dispatch_push
from apps.audit_logs.services.audit_service import log_action

class FailureDashboardService:
    @staticmethod
    def get_failed_deliveries():
        return NotificationDelivery.objects.filter(
            status__in=[NotificationDelivery.Status.FAILED, NotificationDelivery.Status.DEAD_LETTERED]
        ).values(
            'notification__event_type', 'channel', 'provider_name', 'provider_error_code'
        ).annotate(
            count=Count('id')
        ).order_by('-count')

class ResendService:
    @staticmethod
    def manual_resend(delivery_id, admin_user):
        original_delivery = NotificationDelivery.objects.get(id=delivery_id)
        
        # Create new delivery attempt
        new_delivery = NotificationDelivery.objects.create(
            notification=original_delivery.notification,
            channel=original_delivery.channel,
            status=NotificationDelivery.Status.PENDING,
            idempotency_key=f"{original_delivery.notification.id}_{original_delivery.channel}_resend_{timezone.now().timestamp()}"
        )
        
        # Audit log
        log_action(
            actor=admin_user,
            action="notification.manual_resend",
            resource_type="delivery",
            resource_id=str(original_delivery.id),
            metadata={"new_delivery_id": str(new_delivery.id)}
        )
        
        if new_delivery.channel == NotificationDelivery.Channel.EMAIL:
            task_dispatch_email.delay(new_delivery.id)
        elif new_delivery.channel == NotificationDelivery.Channel.PUSH:
            task_dispatch_push.delay(new_delivery.id)
            
        return new_delivery

class NotificationSearchService:
    @staticmethod
    def search(recipient_id=None, event_type=None, status=None, provider_name=None, 
               created_after=None, created_before=None):
        qs = NotificationDelivery.objects.select_related('notification').all()
        
        if recipient_id:
            qs = qs.filter(notification__recipient_id=recipient_id)
        if event_type:
            qs = qs.filter(notification__event_type=event_type)
        if status:
            qs = qs.filter(status=status)
        if provider_name:
            qs = qs.filter(provider_name=provider_name)
        if created_after:
            qs = qs.filter(created_at__gte=created_after)
        if created_before:
            qs = qs.filter(created_at__lte=created_before)
            
        return qs

class NotificationMetricsService:
    @staticmethod
    def get_metrics():
        total = NotificationDelivery.objects.count()
        sent = NotificationDelivery.objects.filter(status=NotificationDelivery.Status.SENT).count()
        failed = NotificationDelivery.objects.filter(status__in=[NotificationDelivery.Status.FAILED, NotificationDelivery.Status.DEAD_LETTERED]).count()
        dead_letter = NotificationDelivery.objects.filter(status=NotificationDelivery.Status.DEAD_LETTERED).count()
        
        success_rate = (sent / total * 100) if total > 0 else 0
        
        avg_retries = NotificationDelivery.objects.aggregate(Avg('retry_count'))['retry_count__avg'] or 0
        
        return {
            "total_sent": sent,
            "total_failed": failed,
            "success_rate": success_rate,
            "average_retry_count": avg_retries,
            "dead_letter_count": dead_letter
        }
