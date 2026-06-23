from apps.common.events.base import EventEnvelope
from apps.common.events.publisher import EventPublisher

PAYMENT_PRODUCER = 'PaymentService'
EXPIRY_PRODUCER = 'Payment Expiry Background Job'
WEBHOOK_PRODUCER = 'WebhookService'

class PaymentEvents:
    @staticmethod
    def payment_initialized(correlation_id: str, payment_id, order_id, amount, currency: str, paystack_reference: str):
        event = EventEnvelope.create(
            event_name="payment.initialized",
            correlation_id=correlation_id,
            producer=PAYMENT_PRODUCER,
            data={
                "payment_id": str(payment_id),
                "order_id": str(order_id),
                "amount": str(amount),
                "currency": currency,
                "paystack_reference": paystack_reference
            }
        )
        EventPublisher.publish(event)

    @staticmethod
    def payment_paid(correlation_id: str, payment_id, order_id, amount, currency: str, paystack_reference: str, paid_at):
        event = EventEnvelope.create(
            event_name="payment.paid",
            correlation_id=correlation_id,
            producer=WEBHOOK_PRODUCER,
            data={
                "payment_id": str(payment_id),
                "order_id": str(order_id),
                "amount": str(amount),
                "currency": currency,
                "paystack_reference": paystack_reference,
                "paid_at": str(paid_at) if paid_at else None
            }
        )
        EventPublisher.publish(event)

    @staticmethod
    def payment_failed(correlation_id: str, payment_id, order_id, paystack_reference: str, failure_reason: str):
        event = EventEnvelope.create(
            event_name="payment.failed",
            correlation_id=correlation_id,
            producer=WEBHOOK_PRODUCER,
            data={
                "payment_id": str(payment_id),
                "order_id": str(order_id),
                "paystack_reference": paystack_reference,
                "failure_reason": failure_reason
            }
        )
        EventPublisher.publish(event)

    @staticmethod
    def payment_cancelled(correlation_id: str, payment_id, order_id):
        event = EventEnvelope.create(
            event_name="payment.cancelled",
            correlation_id=correlation_id,
            producer=PAYMENT_PRODUCER,
            data={
                "payment_id": str(payment_id),
                "order_id": str(order_id)
            }
        )
        EventPublisher.publish(event)

    @staticmethod
    def payment_expired(correlation_id: str, payment_id, order_id):
        event = EventEnvelope.create(
            event_name="payment.expired",
            correlation_id=correlation_id,
            producer=EXPIRY_PRODUCER,
            data={
                "payment_id": str(payment_id),
                "order_id": str(order_id)
            }
        )
        EventPublisher.publish(event)

class WebhookEvents:
    @staticmethod
    def webhook_received(correlation_id: str, paystack_reference: str, event_type: str):
        event = EventEnvelope.create(
            event_name="webhook.received",
            correlation_id=correlation_id,
            producer=WEBHOOK_PRODUCER,
            data={
                "paystack_reference": paystack_reference,
                "event_type": event_type
            }
        )
        EventPublisher.publish(event)

    @staticmethod
    def webhook_rejected(correlation_id: str, paystack_reference: str, rejection_reason: str):
        event = EventEnvelope.create(
            event_name="webhook.rejected",
            correlation_id=correlation_id,
            producer=WEBHOOK_PRODUCER,
            data={
                "paystack_reference": paystack_reference,
                "rejection_reason": rejection_reason
            }
        )
        EventPublisher.publish(event)
