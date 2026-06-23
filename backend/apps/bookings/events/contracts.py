from dataclasses import dataclass
from typing import Optional, Dict, Any

@dataclass(frozen=True)
class BookingCreatedPayload:
    booking_id: str
    request_id: str
    status: str = "unscheduled"

@dataclass(frozen=True)
class BookingScheduledPayload:
    booking_id: str
    request_id: str
    technician_id: str
    start_time: str
    end_time: str
    duration_days: int

@dataclass(frozen=True)
class BookingRescheduledPayload:
    booking_id: str
    request_id: str
    new_start_time: str
    new_end_time: str
    previous_start_time: str
    reschedule_count: int

@dataclass(frozen=True)
class BookingDurationExtendedPayload:
    booking_id: str
    request_id: str
    previous_duration_days: int
    new_duration_days: int

@dataclass(frozen=True)
class BookingInProgressPayload:
    booking_id: str
    request_id: str
    started_at: str

@dataclass(frozen=True)
class BookingCompletedPayload:
    booking_id: str
    request_id: str

@dataclass(frozen=True)
class BookingCancelledPayload:
    booking_id: str
    request_id: str

@dataclass(frozen=True)
class BookingNoShowPayload:
    booking_id: str
    request_id: str
    absent_party: str
    declared_at: str

@dataclass(frozen=True)
class BookingReminderSentPayload:
    booking_id: str
    request_id: str
    reminder_type: str
    recipient_role: str

@dataclass(frozen=True)
class WorkingHoursUpdatedPayload:
    technician_id: str
    schedule_blob: Dict[str, Any]

@dataclass(frozen=True)
class BlackoutCreatedPayload:
    technician_id: str
    blackout_id: str

@dataclass(frozen=True)
class BlackoutDeletedPayload:
    technician_id: str
    blackout_id: str
