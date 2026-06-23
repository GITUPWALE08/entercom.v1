from dataclasses import dataclass, field
import uuid
from datetime import datetime, timezone
from typing import Any

@dataclass(frozen=True)
class BaseEvent:
    """
    Base contract for all Domain Events ensuring mandatory tracing headers.
    Ref: docs/implementation/request/request-event-contracts.md (Section 4.4 Payload Structure Template)
    """
    request_id: int
    correlation_id: str
    actor_id: int
    event_name: str
    data: Any  # Strongly typed payload from contracts.py
    event_id: str = field(default_factory=lambda: str(uuid.uuid4()))
    timestamp: str = field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

    def to_dict(self) -> dict:
        """Serializes the event for broker transport."""
        return {
            "event_id": self.event_id,
            "request_id": self.request_id,
            "correlation_id": self.correlation_id,
            "timestamp": self.timestamp,
            "actor_id": self.actor_id,
            "event": self.event_name,
            "data": self.data.__dict__ if hasattr(self.data, '__dict__') else self.data
        }
