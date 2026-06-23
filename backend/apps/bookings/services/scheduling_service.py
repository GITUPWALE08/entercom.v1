import logging
from datetime import datetime, timedelta
from typing import Optional, Tuple, Any
from django.db import transaction
from django.core.exceptions import PermissionDenied, ValidationError

from ..models.booking import Booking
from ..models.reschedule_record import RescheduleRecord
from .availability_service import AvailabilityService
from ..permissions.checkers import BookingPermissionChecker
from ..events.publishers import BookingEventPublisher
from apps.audit_logs.services.audit_service import log_action

logger = logging.getLogger(__name__)

class SchedulingService:
    """
    Handles temporal assignment and subsequent alterations of a Booking.
    Consolidates initial scheduling and rescheduling logic.
    """

    @staticmethod
    @transaction.atomic
    def schedule_booking(booking_id: str, start_time: datetime, actor: Any, correlation_id: str = "") -> Booking:
        """
        Assigns the initial temporal window to an unscheduled booking.
        Source: scheduling-flow.md Section 5.4
        """
        # 1. Fetch and Lock Booking
        booking = Booking.objects.select_for_update().get(id=booking_id)

        # 2. Permission Check
        if not BookingPermissionChecker.can_schedule_booking(actor.role):
            raise PermissionDenied("Unauthorized to schedule bookings.")
        
        # 3. Validation
        if booking.status != Booking.Status.UNSCHEDULED:
            raise ValidationError("Only unscheduled bookings can be scheduled.")

        # 4. Calculate End Time based on Duration
        duration_days = booking.duration_days or 1
        end_time = start_time + timedelta(days=duration_days)

        # 5. Validate Availability (JIT Revalidation)
        if AvailabilityService.has_conflict(booking.technician_id, start_time, end_time):
            raise ValidationError("Technician is not available for the requested window.")

        # 6. State Change
        booking.start_time = start_time
        booking.end_time = end_time
        booking.status = Booking.Status.SCHEDULED
        booking.save()

        # 7. Audit
        log_action(
            action="booking.scheduled",
            actor=actor,
            resource_type="Booking",
            resource_id=str(booking.id),
            metadata={
                "start_time": start_time.isoformat(),
                "end_time": end_time.isoformat(),
                "duration_days": duration_days,
                "technician_id": str(booking.technician_id),
                "is_displacement": False # Requirement from audit-spec
            }
        )

        # 8. Event
        transaction.on_commit(lambda: BookingEventPublisher.publish_booking_scheduled(
            booking_id=str(booking.id),
            request_id=str(booking.request_id),
            correlation_id=correlation_id,
            actor_id=str(actor.id),
            technician_id=str(booking.technician_id),
            start_time=start_time.isoformat(),
            end_time=end_time.isoformat(),
            duration_days=duration_days
        ))

        logger.info(f"Booking {booking_id} scheduled for {start_time} - {end_time} by {actor.id}")
        return booking

    @staticmethod
    @transaction.atomic
    def reschedule_booking(booking_id: str, new_start_time: datetime, actor: Any, reason_code: str, correlation_id: str = "") -> Booking:
        """
        Alters an existing scheduled window. Enforces 3-reschedule limit.
        Source: rescheduling-flow.md Section 12.1
        """
        # 1. Fetch and Lock Booking
        booking = Booking.objects.select_for_update().get(id=booking_id)

        # 2. Permission Check
        if not BookingPermissionChecker.can_reschedule_booking(actor.role, user=actor, booking=booking):
            raise PermissionDenied("Unauthorized to reschedule this booking.")

        # 3. Validation
        if booking.status != Booking.Status.SCHEDULED:
            raise ValidationError("Only scheduled bookings can be rescheduled.")

        if booking.reschedule_count >= 3:
            raise ValidationError("Maximum reschedule limit (3) reached for this booking.")

        # 4. Calculate New End Time
        duration_days = booking.duration_days or 1
        new_end_time = new_start_time + timedelta(days=duration_days)

        # 5. Validate Availability (Excluding this booking's current window)
        if AvailabilityService.has_conflict(booking.technician_id, new_start_time, new_end_time, exclude_booking_id=booking_id):
            raise ValidationError("Technician is not available for the new window.")

        prev_window = {
            "start_time": booking.start_time.isoformat() if booking.start_time else None,
            "end_time": booking.end_time.isoformat() if booking.end_time else None
        }
        new_window = {
            "start_time": new_start_time.isoformat(),
            "end_time": new_end_time.isoformat()
        }

        # 6. Capture Audit Delta (RescheduleRecord)
        RescheduleRecord.objects.create(
            booking=booking,
            actor=actor,
            correlation_id=correlation_id,
            previous_start_time=booking.start_time,
            previous_end_time=booking.end_time,
            new_start_time=new_start_time,
            new_end_time=new_end_time,
            reason_code=reason_code
        )

        # 7. State Change
        booking.start_time = new_start_time
        booking.end_time = new_end_time
        booking.reschedule_count += 1
        booking.save()

        # 8. Audit (Centralized Audit Log)
        log_action(
            action="booking.rescheduled",
            actor=actor,
            resource_type="Booking",
            resource_id=str(booking.id),
            metadata={
                "previous_window": prev_window,
                "new_window": new_window,
                "reschedule_count": booking.reschedule_count,
                "reason_code": reason_code
            }
        )

        # 9. Event
        transaction.on_commit(lambda: BookingEventPublisher.publish_booking_rescheduled(
            booking_id=str(booking.id),
            request_id=str(booking.request_id),
            correlation_id=correlation_id,
            actor_id=str(actor.id),
            previous_window=prev_window,
            new_window=new_window,
            reschedule_count=booking.reschedule_count
        ))

        logger.info(f"Booking {booking_id} rescheduled to {new_start_time} by {actor.id}. Count: {booking.reschedule_count}")
        return booking
