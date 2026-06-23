import logging
import uuid
from celery import shared_task
from django.utils import timezone
from apps.payments.models import Payment, PaymentStatus
from apps.payments.services.payment_service import PaymentService

logger = logging.getLogger(__name__)

class SystemActor:
    id = "SYSTEM"
    type = "SYSTEM"

@shared_task(
    bind=True, 
    max_retries=3, 
    autoretry_for=(Exception,), 
    retry_backoff=True, 
    retry_jitter=True
)
def expire_payments_job(self):
    """
    Finds pending payments that are older than 24h and cancels them via PaymentService.
    """
    try:
        actor = SystemActor()
        correlation_id = str(uuid.uuid4())
        
        PaymentService.expire_payments(
            actor=actor, 
            correlation_id=correlation_id
        )
            
    except Exception as exc:
        logger.error(f"expire_payments_job failed: {str(exc)}")
        raise

@shared_task
def webhook_reconciliation_job():
    """
    Future placeholder for missed Paystack webhooks recovery.
    """
    raise NotImplementedError("Webhook Reconciliation Job is a future placeholder.")
