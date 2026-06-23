from apps.common.events.base import EventEnvelope
from apps.common.events.publisher import EventPublisher

PRODUCER = 'OrderService'

class OrderEvents:
    @staticmethod
    def order_created(correlation_id: str, order_id, request_id, customer_id, total_amount):
        event = EventEnvelope.create(
            event_name="order.created",
            correlation_id=correlation_id,
            producer=PRODUCER,
            data={
                "order_id": str(order_id),
                "request_id": str(request_id),
                "customer_id": str(customer_id),
                "total_amount": str(total_amount)
            }
        )
        EventPublisher.publish(event)

    @staticmethod
    def order_cancelled(correlation_id: str, order_id, cancellation_reason: str):
        event = EventEnvelope.create(
            event_name="order.cancelled",
            correlation_id=correlation_id,
            producer=PRODUCER,
            data={
                "order_id": str(order_id),
                "cancellation_reason": cancellation_reason
            }
        )
        EventPublisher.publish(event)

    @staticmethod
    def order_fulfilled(correlation_id: str, order_id):
        event = EventEnvelope.create(
            event_name="order.fulfilled",
            correlation_id=correlation_id,
            producer=PRODUCER,
            data={
                "order_id": str(order_id)
            }
        )
        EventPublisher.publish(event)
