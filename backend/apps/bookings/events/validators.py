import uuid
from typing import Any
from django.core.exceptions import ValidationError
from .base import BaseBookingEvent

class EventValidator:
    """
    Validation logic for Booking domain events.
    Fails closed if contracts are violated.
    Source: booking-event-contracts.md Section 5.3
    """

    @staticmethod
    def validate_event(event: BaseBookingEvent) -> None:
        """
        Performs high-level validation on the event envelope and payload.
        """
        # 1. Validate mandatory tracing headers
        if not event.event_name:
            raise ValidationError("Event name is mandatory.")
        
        if not event.correlation_id:
            raise ValidationError("Correlation ID is mandatory.")
        
        if not event.actor_id:
            raise ValidationError("Actor ID is mandatory.")

        # 2. Validate UUID formats
        EventValidator._is_valid_uuid(event.event_id, "event_id")
        EventValidator._is_valid_uuid(event.correlation_id, "correlation_id")
        
        if event.request_id:
            EventValidator._is_valid_uuid(event.request_id, "request_id")
        
        if event.booking_id:
            EventValidator._is_valid_uuid(event.booking_id, "booking_id")

        # 3. Payload validation (check required fields in data)
        # Note: Dataclasses handle type checking during initialization, 
        # but we add explicit presence checks here if needed.
        if event.data is None:
            raise ValidationError("Event payload data cannot be null.")

    @staticmethod
    def _is_valid_uuid(val: str, field_name: str) -> None:
        try:
            uuid.UUID(str(val))
        except (ValueError, AttributeError, TypeError):
            raise ValidationError(f"Invalid UUID format for {field_name}: {val}")
