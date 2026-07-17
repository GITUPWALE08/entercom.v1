import logging
from datetime import timedelta
from django.utils import timezone
from celery import shared_task
from django.core.cache import cache
from .models import Notification, NotificationDelivery
from .services import FailureRecoveryService

logger = logging.getLogger(__name__)

# --- Circuit Breaker ---
class CircuitBreakerOpenException(Exception):
    pass

def circuit_breaker(provider_name, failure_threshold=5, recovery_timeout=60):
    """
    Decorator for wrapping external API calls with a basic circuit breaker using Django cache.
    """
    def decorator(func):
        def wrapper(*args, **kwargs):
            breaker_key = f"circuit_breaker_{provider_name}_failures"
            failures = cache.get(breaker_key, 0)
            
            if failures >= failure_threshold:
                raise CircuitBreakerOpenException(f"Circuit for {provider_name} is OPEN.")
                
            try:
                result = func(*args, **kwargs)
                cache.delete(breaker_key)
                return result
            except Exception as e:
                # Should only count relevant exceptions in real-world, but catching all for now
                if hasattr(e, 'response') and e.response is not None:
                    status = getattr(e.response, 'status_code', 500)
                    if status in [400, 401, 403, 404]:
                        raise e # Permanent errors don't trip circuit usually, but provider outage does.
                
                cache.set(breaker_key, failures + 1, timeout=recovery_timeout)
                raise e
        return wrapper
    return decorator

# --- Dispatch Tasks ---

@shared_task(bind=True, max_retries=10, acks_late=True, default_retry_delay=15)
def task_dispatch_email(self, delivery_id):
    try:
        delivery = NotificationDelivery.objects.select_related('notification').get(
            id=delivery_id, 
            status=NotificationDelivery.Status.PENDING
        )
    except NotificationDelivery.DoesNotExist:
        # Idempotency check: if it's not pending, don't process.
        return
        
    delivery.status = NotificationDelivery.Status.PROCESSING
    delivery.save(update_fields=['status'])
    
    try:
        dispatch_email(delivery)
        delivery.status = NotificationDelivery.Status.SENT
        delivery.provider_response = {"status": "success"}
        delivery.save(update_fields=['status', 'provider_response', 'updated_at'])
    except CircuitBreakerOpenException as e:
        FailureRecoveryService.classify_and_handle_failure(delivery_id, str(e), is_transient=True)
        raise self.retry(exc=e, countdown=self.default_retry_delay * (2 ** self.request.retries))
    except Exception as e:
        is_transient = True
        if hasattr(e, 'response') and e.response is not None:
            status = getattr(e.response, 'status_code', 500)
            if status in [400, 401, 403, 404]:
                is_transient = False
            
            # Check for Retry-After header
            retry_after = getattr(e.response.headers, 'get', lambda x: None)('Retry-After')
            if retry_after and is_transient:
                try:
                    countdown = int(retry_after)
                    FailureRecoveryService.classify_and_handle_failure(delivery_id, str(e), is_transient)
                    raise self.retry(exc=e, countdown=countdown)
                except ValueError:
                    pass
        
        FailureRecoveryService.classify_and_handle_failure(delivery_id, str(e), is_transient)
        if is_transient:
            # Exponential backoff
            countdown = self.default_retry_delay * (2 ** self.request.retries)
            # Max 3600s
            countdown = min(3600, countdown)
            raise self.retry(exc=e, countdown=countdown)

@circuit_breaker("email_provider", failure_threshold=5, recovery_timeout=60)
def dispatch_email(delivery):
    from django.core.mail import EmailMultiAlternatives
    from django.template import Template, Context
    from .models import NotificationTemplate

    notification = delivery.notification
    recipient = notification.recipient
    if not recipient.email:
        # Cannot send if no email
        raise ValueError("Recipient has no email address configured")
        
    try:
        template = NotificationTemplate.objects.get(event_type=notification.event_type)
        ctx = Context(notification.context)
        subject = Template(template.subject).render(ctx)
        html_body = Template(template.html_body).render(ctx)
        text_body = Template(template.plain_text_body).render(ctx)
    except NotificationTemplate.DoesNotExist:
        subject = notification.title
        text_body = notification.message
        html_body = None

    msg = EmailMultiAlternatives(
        subject=subject,
        body=text_body,
        to=[recipient.email]
    )
    if html_body:
        msg.attach_alternative(html_body, "text/html")
    msg.send()


@shared_task(bind=True, max_retries=10, acks_late=True, default_retry_delay=15)
def task_dispatch_push(self, delivery_id):
    try:
        delivery = NotificationDelivery.objects.select_related('notification').get(
            id=delivery_id, 
            status=NotificationDelivery.Status.PENDING
        )
    except NotificationDelivery.DoesNotExist:
        return
        
    delivery.status = NotificationDelivery.Status.PROCESSING
    delivery.save(update_fields=['status'])
    
    try:
        _send_push_mock(delivery)
        delivery.status = NotificationDelivery.Status.SENT
        delivery.provider_response = {"status": "success"}
        delivery.save(update_fields=['status', 'provider_response', 'updated_at'])
    except Exception as e:
        FailureRecoveryService.classify_and_handle_failure(delivery_id, str(e), is_transient=True)
        countdown = min(3600, self.default_retry_delay * (2 ** self.request.retries))
        raise self.retry(exc=e, countdown=countdown)

@circuit_breaker("push_provider", failure_threshold=5, recovery_timeout=60)
def _send_push_mock(delivery):
    pass


# --- Scheduled Jobs (Beat) ---

@shared_task
def job_sweep_transient_failures():
    """Runs every 5 minutes (configured in celery beat schedule)."""
    stuck_deliveries = NotificationDelivery.objects.filter(
        status=NotificationDelivery.Status.FAILED,
        retry_count__lt=10
    )[:1000] # Chunking
    
    for delivery in stuck_deliveries:
        delivery.status = NotificationDelivery.Status.PENDING
        delivery.retry_count += 1
        delivery.save(update_fields=['status', 'retry_count'])
        if delivery.channel == NotificationDelivery.Channel.EMAIL:
            task_dispatch_email.delay(delivery.id)
        elif delivery.channel == NotificationDelivery.Channel.PUSH:
            task_dispatch_push.delay(delivery.id)

@shared_task
def job_enforce_retention_policy():
    """Runs daily at 02:00 AM UTC."""
    thirty_days_ago = timezone.now() - timedelta(days=30)
    ninety_days_ago = timezone.now() - timedelta(days=90)
    one_year_ago = timezone.now() - timedelta(days=365)
    
    # READ older than 30 days -> ARCHIVED
    Notification.objects.filter(status=Notification.Status.READ, created_at__lt=thirty_days_ago).update(status=Notification.Status.ARCHIVED)
    
    # UNREAD older than 90 days -> ARCHIVED
    Notification.objects.filter(status=Notification.Status.UNREAD, created_at__lt=ninety_days_ago).update(status=Notification.Status.ARCHIVED)
    
    # ARCHIVED older than 365 days -> Physically purge in chunks
    while True:
        ids = list(Notification.objects.filter(status=Notification.Status.ARCHIVED, created_at__lt=one_year_ago).values_list('id', flat=True)[:1000])
        if not ids:
            break
        Notification.objects.filter(id__in=ids).delete()

@shared_task
def job_purge_successful_deliveries():
    """Runs daily at 03:00 AM UTC."""
    fourteen_days_ago = timezone.now() - timedelta(days=14)
    while True:
        ids = list(NotificationDelivery.objects.filter(status=NotificationDelivery.Status.SENT, updated_at__lt=fourteen_days_ago).values_list('id', flat=True)[:1000])
        if not ids:
            break
        NotificationDelivery.objects.filter(id__in=ids).delete()
