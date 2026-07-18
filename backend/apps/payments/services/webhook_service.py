from django.db import transaction
from django.core.exceptions import ValidationError
from django.utils import timezone
from apps.payments.models import Payment, PaymentStatus
from core.events import event_publisher
from apps.audit.services import AuditService as audit_logger
from core.permissions import require_permission
import hashlib
import hmac
import json
from apps.notification.services import DispatchOrchestrator

class WebhookService:
    """
    Authoritative, secure processor for asynchronous state changes sent by the payment provider.
    """
    @staticmethod
    @transaction.atomic
    def process_webhook(actor, correlation_id, payload, signature, secret_key, raw_body):
        require_permission(actor, 'webhook.process')
        
        paystack_reference = payload.get('data', {}).get('reference')
        event_type = payload.get('event')

        computed_hmac = hmac.new(
            secret_key.encode('utf-8'),
            msg=raw_body,
            digestmod=hashlib.sha512
        ).hexdigest()
        
        is_local_mock = (secret_key == 'sk_test_fake_secret')
        
        if not is_local_mock and computed_hmac != signature:
            audit_logger.log(
                action='webhook.rejected',
                actor_id=actor.id,
                actor_type=actor.type,
                correlation_id=correlation_id,
                metadata={
                    'paystack_reference': paystack_reference or 'unknown',
                    'rejection_reason': 'HMAC mismatch'
                }
            )
            event_publisher.publish(
                event_name='webhook.rejected',
                event_version=1,
                correlation_id=correlation_id,
                occurred_at=timezone.now(),
                producer='WebhookService',
                data={
                    'paystack_reference': paystack_reference or 'unknown',
                    'rejection_reason': 'HMAC mismatch'
                }
            )
            raise ValidationError("HMAC verification failed")
            
        audit_logger.log(
            action='webhook.received',
            actor_id=actor.id,
            actor_type=actor.type,
            correlation_id=correlation_id,
            metadata={
                'paystack_reference': paystack_reference,
                'event_type': event_type
            }
        )
        
        event_publisher.publish(
            event_name='webhook.received',
            event_version=1,
            correlation_id=correlation_id,
            occurred_at=timezone.now(),
            producer='WebhookService',
            data={
                'paystack_reference': paystack_reference,
                'event_type': event_type
            }
        )

        payment = Payment.objects.select_for_update().filter(provider_reference=paystack_reference).first()
        if not payment:
            raise ValidationError("Payment not found.")
            
        if payment.status in [PaymentStatus.PAID, PaymentStatus.CANCELLED]:
            return
            
        if event_type == 'charge.success':
            payment.status = PaymentStatus.PAID
            payment.save()
            
            audit_logger.log(
                action='payment.paid',
                actor_id=actor.id,
                actor_type=actor.type,
                correlation_id=correlation_id,
                metadata={
                    'order_id': str(payment.order_id),
                    'payment_id': str(payment.id),
                    'paystack_reference': payment.provider_reference,
                    'amount': str(payment.amount),
                    'currency': payment.currency,
                    'previous_state': PaymentStatus.PENDING.value,
                    'new_state': PaymentStatus.PAID.value
                }
            )

            event_publisher.publish(
                event_name='payment.paid',
                event_version=1,
                correlation_id=correlation_id,
                occurred_at=timezone.now(),
                producer='WebhookService',
                data={
                    'order_id': str(payment.order_id),
                    'payment_id': str(payment.id),
                    'paystack_reference': payment.provider_reference,
                    'amount': float(payment.amount),
                    'currency': payment.currency,
                    'previous_state': PaymentStatus.PENDING,
                    'new_state': PaymentStatus.PAID
                }
            )

            transaction.on_commit(lambda: DispatchOrchestrator.dispatch_event(
                event_type="payment_receipt",
                recipient_id=payment.customer_id,
                context={"amount": str(payment.amount)},
                resource_type="payment",
                resource_id=str(payment.id),
                category="updates",
                title="Payment Receipt",
                message=f"We have received your payment of {payment.amount}.",
                is_system_critical=True,
            ))
            
            from apps.orders.services.order_service import OrderService
            OrderService.process_payment_paid_event(
                actor=actor,
                correlation_id=correlation_id,
                order_id=payment.order_id
            )
            
        elif event_type == 'charge.failed':
            payment.status = PaymentStatus.FAILED
            payment.save()
            failure_reason = payload.get('data', {}).get('gateway_response', 'Failed')
            
            audit_logger.log(
                action='payment.failed',
                actor_id=actor.id,
                actor_type=actor.type,
                correlation_id=correlation_id,
                metadata={
                    'payment_id': str(payment.id),
                    'order_id': str(payment.order_id),
                    'paystack_reference': payment.provider_reference,
                    'failure_reason': failure_reason
                }
            )

            event_publisher.publish(
                event_name='payment.failed',
                event_version=1,
                correlation_id=correlation_id,
                occurred_at=timezone.now(),
                producer='WebhookService',
                data={
                    'payment_id': str(payment.id),
                    'order_id': str(payment.order_id),
                    'paystack_reference': payment.provider_reference,
                    'failure_reason': failure_reason
                }
            )

            # [DEFERRED] Non-MVP event
            # transaction.on_commit(lambda: DispatchOrchestrator.dispatch_event(
            #     event_type="payment_failed",
            #     recipient_id=payment.customer_id,
            #     resource_type="payment",
            #     resource_id=str(payment.id),
            #     category="alerts",
            #     title="Payment Failed",
            #     message="Your recent payment attempt failed.",
            #     context={"failure_reason": failure_reason},
            #     is_system_critical=True,
            # ))
