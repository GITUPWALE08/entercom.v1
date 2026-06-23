from django.db import transaction
from django.core.exceptions import ValidationError
from django.utils import timezone
from apps.payments.models import Payment, PaymentStatus
from core.events import event_publisher
from apps.audit.services import AuditService as audit_logger
from core.permissions import require_permission

class PaymentService:
    """
    Orchestrates the internal Payment aggregate lifecycle, handles retries, and manages provider synchronization.
    """
    @staticmethod
    @transaction.atomic
    def initialize_payment(actor, correlation_id, order_id, request_id, customer_id, amount, currency, provider_reference):
        require_permission(actor, 'payment.initialize')
        
        payment = Payment.objects.select_for_update().filter(order_id=order_id).first()
        if payment:
            payment.provider_reference = provider_reference
            payment.status = PaymentStatus.PENDING
            payment.save()
        else:
            payment = Payment.objects.create(
                order_id=order_id,
                request_id=request_id,
                customer_id=customer_id,
                provider_reference=provider_reference,
                amount=amount,
                currency=currency,
                status=PaymentStatus.PENDING,
                correlation_id=correlation_id
            )
            
        audit_logger.log(
            action='payment.initialized',
            actor_id=actor.id,
            actor_type=actor.type,
            correlation_id=correlation_id,
            metadata={
                'payment_id': str(payment.id),
                'order_id': str(order_id),
                'amount': str(amount),
                'currency': currency,
                'paystack_reference': provider_reference
            }
        )
        
        event_publisher.publish(
            event_name='payment.initialized',
            event_version=1,
            correlation_id=correlation_id,
            occurred_at=timezone.now(),
            producer='PaymentService',
            data={
                'payment_id': str(payment.id),
                'order_id': str(order_id),
                'amount': float(amount),
                'currency': currency,
                'paystack_reference': provider_reference
            }
        )
        return payment

    @staticmethod
    @transaction.atomic
    def expire_payments(actor, correlation_id):
        cutoff_time = timezone.now() - timezone.timedelta(hours=24)
        expired_payments = Payment.objects.select_for_update().filter(
            status__in=[PaymentStatus.PENDING, PaymentStatus.FAILED],
            created_at__lte=cutoff_time
        )
        
        for payment in expired_payments:
            payment.status = PaymentStatus.CANCELLED
            payment.save()
            
            audit_logger.log(
                action='payment.expired',
                actor_id=actor.id,
                actor_type=actor.type,
                correlation_id=correlation_id,
                metadata={
                    'payment_id': str(payment.id),
                    'order_id': str(payment.order_id)
                }
            )
            event_publisher.publish(
                event_name='payment.expired',
                event_version=1,
                correlation_id=correlation_id,
                occurred_at=timezone.now(),
                producer='PaymentService',
                data={
                    'payment_id': str(payment.id),
                    'order_id': str(payment.order_id)
                }
            )

    @staticmethod
    @transaction.atomic
    def cancel_payment(actor, correlation_id, payment_id):
        require_permission(actor, 'payment.cancel')
        payment = Payment.objects.select_for_update().filter(id=payment_id).first()
        if not payment:
            raise ValidationError("Payment not found.")
            
        payment.status = PaymentStatus.CANCELLED
        payment.save()

        audit_logger.log(
            action='payment.cancelled',
            actor_id=actor.id,
            actor_type=actor.type,
            correlation_id=correlation_id,
            metadata={
                'payment_id': str(payment.id),
                'order_id': str(payment.order_id)
            }
        )

        event_publisher.publish(
            event_name='payment.cancelled',
            event_version=1,
            correlation_id=correlation_id,
            occurred_at=timezone.now(),
            producer='PaymentService',
            data={
                'payment_id': str(payment.id),
                'order_id': str(payment.order_id)
            }
        )
        return payment
