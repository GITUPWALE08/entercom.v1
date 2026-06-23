from enum import Enum

class BookingEventName(str, Enum):
    """
    Canonical taxonomy of events emitted by the Booking domain.
    Source: booking-event-contracts.md Section 5.2
    """
    CREATED = "booking.created"
    SCHEDULED = "booking.scheduled"
    RESCHEDULED = "booking.rescheduled"
    DURATION_EXTENDED = "booking.duration_extended"
    IN_PROGRESS = "booking.in_progress"
    COMPLETED = "booking.completed"
    CANCELLED = "booking.cancelled"
    NO_SHOW = "booking.no_show"
    REMINDER_SENT = "booking.reminder_sent"
    WORKING_HOURS_UPDATED = "availability.working_hours_updated"
    BLACKOUT_CREATED = "availability.blackout_created"
    BLACKOUT_DELETED = "availability.blackout_deleted"
