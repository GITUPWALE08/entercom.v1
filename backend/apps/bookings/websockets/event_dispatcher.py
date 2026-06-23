import logging
from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer
from ..events.base import BaseBookingEvent
from ..events.types import BookingEventName

logger = logging.getLogger(__name__)

class BookingWebSocketDispatcher:
    """
    Translates Booking Domain Events into Realtime WebSocket Broadcasts.
    Strictly uses request_{id} channels per Phase 4F architecture.
    Source: booking-websocket-spec.md Section 5.1 & 5.2
    """

    # Authorized Realtime Event Inventory
    # Explicitly excludes booking.reminder_sent and availability.working_hours_updated
    ALLOWED_EVENTS = {
        BookingEventName.CREATED.value,
        BookingEventName.SCHEDULED.value,
        BookingEventName.RESCHEDULED.value,
        BookingEventName.DURATION_EXTENDED.value,
        BookingEventName.IN_PROGRESS.value,
        BookingEventName.COMPLETED.value,
        BookingEventName.CANCELLED.value,
        BookingEventName.NO_SHOW.value,
    }

    @classmethod
    def dispatch(cls, event: BaseBookingEvent) -> None:
        """
        Routes a domain event to the appropriate WebSocket group.
        """
        event_name = getattr(event.event_name, 'value', str(event.event_name))
        
        if event_name not in cls.ALLOWED_EVENTS:
            logger.debug(f"Event {event_name} is not authorized for realtime broadcast. Skipping.")
            return

        request_id = event.request_id
        if not request_id:
            logger.error(f"Cannot broadcast {event_name}: Missing request_id.")
            return

        # Topology Rule: Broadcast strictly through the parent request_{id} channel.
        # This guarantees subordinate integrity and ensures automatic reassignment eviction.
        group_name = f"request_{request_id}"

        # Payload Rules: Strict adherence to booking-event-contracts.md
        # Wrapping event data exactly as expected by RequestConsumer.request_event
        payload = {
            "type": "request_event", 
            "event": event_name,
            "version": getattr(event, "event_version", "v1"),
            "timestamp": event.occurred_at,
            "request_id": str(request_id),
            "payload": event.to_dict().get("data", {})
        }

        channel_layer = get_channel_layer()
        if channel_layer:
            try:
                async_to_sync(channel_layer.group_send)(group_name, payload)
                logger.info(f"Broadcasted realtime event {event_name} to group {group_name}")
            except Exception as e:
                logger.error(f"WebSocket broadcast failed for {event_name} on {group_name}: {e}")
        else:
            logger.warning("Channel layer not configured. Realtime broadcast skipped.")
