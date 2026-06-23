import logging
from typing import Any, Optional, Dict
from django.db import transaction
from .types import BookingEventName
from .base import BaseBookingEvent
from .contracts import (
    BookingCreatedPayload,
    BookingScheduledPayload,
    BookingRescheduledPayload,
    BookingDurationExtendedPayload,
    BookingInProgressPayload,
    BookingCompletedPayload,
    BookingCancelledPayload,
    BookingNoShowPayload,
    BookingReminderSentPayload,
    WorkingHoursUpdatedPayload,
    BlackoutCreatedPayload,
    BlackoutDeletedPayload
)
from .validators import EventValidator

logger = logging.getLogger(__name__)

class BookingEventPublisher:
    """
    Central publisher for Booking Domain Events.
    Ensures events are validated and published only after database commit.
    Source: booking-event-contracts.md Section 5.3
    """
    
    @staticmethod
    def _dispatch(event: BaseBookingEvent) -> None:
        """
        Validates and logs the event. In a production environment, 
        this would also push to a message broker (Celery, Kafka, etc.).
        """
        # 1. Validation (Fail Closed)
        EventValidator.validate_event(event)

        # 2. Log / Transport
        logger.info(f"Published Booking Domain Event: {event.event_name}", extra=event.to_dict())

        # Bridge to WebSockets
        try:
            from apps.bookings.websockets.event_dispatcher import BookingWebSocketDispatcher
            BookingWebSocketDispatcher.dispatch(event)
        except ImportError:
            logger.debug("Booking WebSocket dispatcher not available.")
        except Exception as e:
            logger.error(f"Failed to bridge booking event {event.event_name} to WebSockets: {e}")

    @classmethod
    def _publish(cls, event: BaseBookingEvent):
        """
        Transactional safety wrapper.
        """
        transaction.on_commit(lambda: cls._dispatch(event))

    @classmethod
    def publish_booking_created(cls, booking_id: str, request_id: str, correlation_id: str, actor_id: str):
        data = BookingCreatedPayload(booking_id=booking_id, request_id=request_id)
        event = BaseBookingEvent(
            event_name=BookingEventName.CREATED.value,
            correlation_id=correlation_id,
            actor_id=actor_id,
            request_id=request_id,
            booking_id=booking_id,
            data=data
        )
        cls._publish(event)

    @classmethod
    def publish_booking_scheduled(cls, booking_id: str, request_id: str, correlation_id: str, actor_id: str, technician_id: str, start_time: str, end_time: str, duration_days: int):
        data = BookingScheduledPayload(
            booking_id=booking_id,
            request_id=request_id,
            technician_id=technician_id,
            start_time=start_time,
            end_time=end_time,
            duration_days=duration_days
        )
        event = BaseBookingEvent(
            event_name=BookingEventName.SCHEDULED.value,
            correlation_id=correlation_id,
            actor_id=actor_id,
            request_id=request_id,
            booking_id=booking_id,
            data=data
        )
        cls._publish(event)

    @classmethod
    def publish_booking_rescheduled(cls, booking_id: str, request_id: str, correlation_id: str, actor_id: str, previous_start_time: str, new_start_time: str, new_end_time: str, reschedule_count: int):
        data = BookingRescheduledPayload(
            booking_id=booking_id,
            request_id=request_id,
            new_start_time=new_start_time,
            new_end_time=new_end_time,
            previous_start_time=previous_start_time,
            reschedule_count=reschedule_count
        )
        event = BaseBookingEvent(
            event_name=BookingEventName.RESCHEDULED.value,
            correlation_id=correlation_id,
            actor_id=actor_id,
            request_id=request_id,
            booking_id=booking_id,
            data=data
        )
        cls._publish(event)

    @classmethod
    def publish_booking_duration_extended(cls, booking_id: str, request_id: str, correlation_id: str, actor_id: str, previous_duration: int, new_duration: int):
        data = BookingDurationExtendedPayload(
            booking_id=booking_id,
            request_id=request_id,
            previous_duration_days=previous_duration,
            new_duration_days=new_duration
        )
        event = BaseBookingEvent(
            event_name=BookingEventName.DURATION_EXTENDED.value,
            correlation_id=correlation_id,
            actor_id=actor_id,
            request_id=request_id,
            booking_id=booking_id,
            data=data
        )
        cls._publish(event)

    @classmethod
    def publish_booking_in_progress(cls, booking_id: str, request_id: str, correlation_id: str, actor_id: str, started_at: str):
        data = BookingInProgressPayload(
            booking_id=booking_id,
            request_id=request_id,
            started_at=started_at
        )
        event = BaseBookingEvent(
            event_name=BookingEventName.IN_PROGRESS.value,
            correlation_id=correlation_id,
            actor_id=actor_id,
            request_id=request_id,
            booking_id=booking_id,
            data=data
        )
        cls._publish(event)

    @classmethod
    def publish_booking_completed(cls, booking_id: str, request_id: str, correlation_id: str, actor_id: str):
        data = BookingCompletedPayload(booking_id=booking_id, request_id=request_id)
        event = BaseBookingEvent(
            event_name=BookingEventName.COMPLETED.value,
            correlation_id=correlation_id,
            actor_id=actor_id,
            request_id=request_id,
            booking_id=booking_id,
            data=data
        )
        cls._publish(event)

    @classmethod
    def publish_booking_cancelled(cls, booking_id: str, request_id: str, correlation_id: str, actor_id: str):
        data = BookingCancelledPayload(booking_id=booking_id, request_id=request_id)
        event = BaseBookingEvent(
            event_name=BookingEventName.CANCELLED.value,
            correlation_id=correlation_id,
            actor_id=actor_id,
            request_id=request_id,
            booking_id=booking_id,
            data=data
        )
        cls._publish(event)

    @classmethod
    def publish_booking_no_show(cls, booking_id: str, request_id: str, correlation_id: str, actor_id: str, absent_party: str, declared_at: str):
        data = BookingNoShowPayload(
            booking_id=booking_id,
            request_id=request_id,
            absent_party=absent_party,
            declared_at=declared_at
        )
        event = BaseBookingEvent(
            event_name=BookingEventName.NO_SHOW.value,
            correlation_id=correlation_id,
            actor_id=actor_id,
            request_id=request_id,
            booking_id=booking_id,
            data=data
        )
        cls._publish(event)

    @classmethod
    def publish_booking_reminder_sent(cls, booking_id: str, request_id: str, correlation_id: str, actor_id: str, reminder_type: str, recipient_role: str):
        data = BookingReminderSentPayload(
            booking_id=booking_id,
            request_id=request_id,
            reminder_type=reminder_type,
            recipient_role=recipient_role
        )
        event = BaseBookingEvent(
            event_name=BookingEventName.REMINDER_SENT.value,
            correlation_id=correlation_id,
            actor_id=actor_id,
            request_id=request_id,
            booking_id=booking_id,
            data=data
        )
        cls._publish(event)

    @classmethod
    def publish_working_hours_updated(cls, technician_id: str, correlation_id: str, actor_id: str, schedule_blob: dict):
        data = WorkingHoursUpdatedPayload(
            technician_id=technician_id,
            schedule_blob=schedule_blob
        )
        event = BaseBookingEvent(
            event_name=BookingEventName.WORKING_HOURS_UPDATED.value,
            correlation_id=correlation_id,
            actor_id=actor_id,
            data=data
        )
        cls._publish(event)

    @classmethod
    def publish_blackout_created(cls, technician_id: str, blackout_id: str, correlation_id: str, actor_id: str):
        data = BlackoutCreatedPayload(
            technician_id=technician_id,
            blackout_id=blackout_id
        )
        event = BaseBookingEvent(
            event_name=BookingEventName.BLACKOUT_CREATED.value,
            correlation_id=correlation_id,
            actor_id=actor_id,
            data=data
        )
        cls._publish(event)

    @classmethod
    def publish_blackout_deleted(cls, technician_id: str, blackout_id: str, correlation_id: str, actor_id: str):
        data = BlackoutDeletedPayload(
            technician_id=technician_id,
            blackout_id=blackout_id
        )
        event = BaseBookingEvent(
            event_name=BookingEventName.BLACKOUT_DELETED.value,
            correlation_id=correlation_id,
            actor_id=actor_id,
            data=data
        )
        cls._publish(event)
