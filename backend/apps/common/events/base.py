from dataclasses import dataclass, asdict
from datetime import datetime
import uuid
import json

@dataclass
class EventEnvelope:
    event_name: str
    event_version: int
    correlation_id: str
    occurred_at: str
    producer: str
    data: dict

    @classmethod
    def create(cls, event_name: str, correlation_id: str, producer: str, data: dict, event_version: int = 1):
        return cls(
            event_name=event_name,
            event_version=event_version,
            correlation_id=str(correlation_id),
            occurred_at=datetime.utcnow().isoformat() + "Z",
            producer=producer,
            data=data
        )

    def to_dict(self):
        return asdict(self)
