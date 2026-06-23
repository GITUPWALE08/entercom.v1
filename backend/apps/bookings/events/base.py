from dataclasses import dataclass, field, asdict
import uuid
from datetime import datetime, timezone
from typing import Any, Optional

@dataclass(frozen=True)
class BaseBookingEvent:
    """
    Base contract for all Booking Domain Events ensuring mandatory tracing headers.
    Source: booking-event-contracts.md Section 4
    """
    event_name: str
    correlation_id: str
    actor_id: str
    data: Any  # Strongly typed payload from contracts.py
    request_id: Optional[str] = None
    booking_id: Optional[str] = None
    event_id: str = field(default_factory=lambda: str(uuid.uuid4()))
    event_version: str = "v1"
    occurred_at: str = field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

    def to_dict(self) -> dict:
        """Serializes the event for broker transport."""
        return {
            "event_id": self.event_id,
            "event_name": self.event_name,
            "event_version": self.event_version,
            "occurred_at": self.occurred_at,
            "correlation_id": self.correlation_id,
            "request_id": self.request_id,
            "booking_id": self.booking_id,
            "actor_id": self.actor_id,
            "data": asdict(self.data) if hasattr(self.data, '__dataclass_fields__') else self.data
        }
