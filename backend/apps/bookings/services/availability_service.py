import logging
from datetime import datetime, date, time, timedelta
from typing import List, Dict, Any, Optional
from django.db import transaction
from django.utils import timezone
from django.core.exceptions import PermissionDenied

from ..models.working_hours import WorkingHours
from ..models.blackout_date import BlackoutDate
from ..models.booking import Booking
from ..permissions.checkers import BookingPermissionChecker
from ..events.publishers import BookingEventPublisher
from apps.audit_logs.services.audit_service import log_action

logger = logging.getLogger(__name__)

class AvailabilityService:
    """
    Centralized engine for capacity calculation and conflict detection.
    Owns working hours, blackout dates, and slot generation.
    """

    @staticmethod
    def get_technician_availability(technician_id: str, target_date: date, actor: Any = None) -> List[Dict[str, time]]:
        """
        Calculates available slots for a technician on a specific date.
        Derived from Working Hours minus active Bookings and Blackout Dates.
        """
        # 1. Permission Check
        if actor:
            # Note: calendar.view requires technical IDOR check if not Staff/Mgr
            # Here we check if the actor can view the calendar for the specific technician/booking context.
            # For simplicity, if technician_id is provided, we check if it's the actor themselves 
            # or if they are staff/mgr.
            if not BookingPermissionChecker.can_view_calendar(actor.role, user=actor):
                 raise PermissionDenied("Unauthorized to view calendar.")
            
            if actor.role == "TECHNICIAN" and str(actor.id) != str(technician_id):
                 raise PermissionDenied("Technicians can only view their own calendar.")

        # 2. Fetch Working Hours
        try:
            working_hours = WorkingHours.objects.get(technician_id=technician_id)
        except WorkingHours.DoesNotExist:
            return []

        # 3. Extract daily schedule from blob
        day_name = target_date.strftime('%A').lower()
        daily_config = working_hours.schedule_blob.get(day_name)
        if not daily_config or not daily_config.get('active'):
            return []

        start_time_str = daily_config.get('start_time')
        end_time_str = daily_config.get('end_time')
        
        # Convert to time objects
        day_start = datetime.strptime(start_time_str, '%H:%M').time()
        day_end = datetime.strptime(end_time_str, '%H:%M').time()

        # 4. Create initial availability block
        availability = [{
            'start': day_start,
            'end': day_end
        }]

        # 5. Fetch overlapping Bookings and Blackouts
        tz = timezone.get_current_timezone()
        dt_start = timezone.make_aware(datetime.combine(target_date, time.min), tz)
        dt_end = timezone.make_aware(datetime.combine(target_date, time.max), tz)

        # 6. Subtract Bookings
        bookings = Booking.objects.filter(
            technician_id=technician_id,
            status__in=[Booking.Status.SCHEDULED, Booking.Status.IN_PROGRESS],
            start_time__lt=dt_end,
            end_time__gt=dt_start
        )
        
        for booking in bookings:
            availability = AvailabilityService._subtract_range(
                availability, 
                booking.start_time.astimezone(tz).time(), 
                booking.end_time.astimezone(tz).time()
            )

        # 7. Subtract Blackout Dates
        blackouts = BlackoutDate.objects.filter(
            technician_id=technician_id,
            start_time__lt=dt_end,
            end_time__gt=dt_start
        )
        
        for blackout in blackouts:
            availability = AvailabilityService._subtract_range(
                availability, 
                blackout.start_time.astimezone(tz).time(), 
                blackout.end_time.astimezone(tz).time()
            )

        return availability

    @staticmethod
    @transaction.atomic
    def update_working_hours(technician_id: str, schedule_blob: dict, actor: Any, correlation_id: str = "") -> WorkingHours:
        """
        Updates technician working hours.
        Source: booking-permission-mapping.md Section 5.3.5
        """
        # 1. Fetch
        working_hours, created = WorkingHours.objects.get_or_create(technician_id=technician_id)

        # 2. Permission Check
        if not BookingPermissionChecker.can_manage_working_hours(actor.role, user=actor, working_hours=working_hours):
            raise PermissionDenied("Unauthorized to manage working hours.")

        # 3. Validation: Cannot modify if active bookings exist (Simplified check)
        # Note: architecture says "Cannot be modified if active assignments or bookings exist."
        active_commitments = Booking.objects.filter(
            technician_id=technician_id,
            status__in=[Booking.Status.SCHEDULED, Booking.Status.IN_PROGRESS]
        ).exists()
        
        if active_commitments:
            raise ValidationError("Cannot modify working hours with active bookings.")

        prev_schedule = working_hours.schedule_blob
        
        # 4. State Change
        working_hours.schedule_blob = schedule_blob
        working_hours.save()

        # 5. Audit
        log_action(
            action="working_hours.updated",
            actor=actor,
            resource_type="WorkingHours",
            resource_id=str(working_hours.id),
            metadata={
                "previous_schedule": prev_schedule,
                "new_schedule": schedule_blob,
                "active_commitments_checked": True
            }
        )

        # 6. Event
        transaction.on_commit(lambda: BookingEventPublisher.publish_working_hours_updated(
            technician_id=str(technician_id),
            correlation_id=correlation_id,
            actor_id=str(actor.id),
            schedule_blob=schedule_blob
        ))

        return working_hours

    @staticmethod
    def has_conflict(technician_id: str, start_time: datetime, end_time: datetime, exclude_booking_id: Optional[str] = None) -> bool:
        """
        Performs conflict detection for a specific temporal window.
        """
        # 1. Check existing Bookings
        bookings_query = Booking.objects.filter(
            technician_id=technician_id,
            status__in=[Booking.Status.SCHEDULED, Booking.Status.IN_PROGRESS],
            start_time__lt=end_time,
            end_time__gt=start_time
        )
        if exclude_booking_id:
            bookings_query = bookings_query.exclude(id=exclude_booking_id)
        
        if bookings_query.exists():
            return True

        # 2. Check Blackout Dates
        blackouts_query = BlackoutDate.objects.filter(
            technician_id=technician_id,
            start_time__lt=end_time,
            end_time__gt=start_time
        )
        if blackouts_query.exists():
            return True

        return False

    @staticmethod
    def _subtract_range(current_availability: List[Dict[str, time]], sub_start: time, sub_end: time) -> List[Dict[str, time]]:
        new_availability = []
        for block in current_availability:
            if sub_start >= block['end'] or sub_end <= block['start']:
                new_availability.append(block)
                continue
            if sub_start > block['start'] and sub_end < block['end']:
                new_availability.append({'start': block['start'], 'end': sub_start})
                new_availability.append({'start': sub_end, 'end': block['end']})
                continue
            if sub_start <= block['start'] and sub_end < block['end']:
                new_availability.append({'start': sub_end, 'end': block['end']})
                continue
            if sub_start > block['start'] and sub_end >= block['end']:
                new_availability.append({'start': block['start'], 'end': sub_start})
                continue
        return new_availability

    @staticmethod
    @transaction.atomic
    def create_blackout_date(technician_id: str, start_time: datetime, end_time: datetime, actor: Any, correlation_id: str = "") -> BlackoutDate:
        """
        Creates a period of unavailability for a technician.
        Source: booking-service-design.md Section 5.3
        """
        if end_time <= start_time:
            raise ValidationError("End time must be after start time.")

        # 1. Permission Check
        mock_blackout = type('Obj', (object,), {'technician_id': technician_id})
        if not BookingPermissionChecker.can_manage_blackout_dates(actor.role, user=actor, blackout_date=mock_blackout):
            raise PermissionDenied("Unauthorized to manage blackout dates.")

        # 2. Conflict Check: Must not overlap with scheduled/in_progress bookings
        # Use select_for_update or rely on constraints. 
        bookings_conflict = Booking.objects.select_for_update().filter(
            technician_id=technician_id,
            status__in=[Booking.Status.SCHEDULED, Booking.Status.IN_PROGRESS],
            start_time__lt=end_time,
            end_time__gt=start_time
        ).exists()
        
        if bookings_conflict:
            raise ValidationError("Blackout date conflicts with an existing booking.")

        # 3. Create
        blackout = BlackoutDate.objects.create(
            technician_id=technician_id,
            start_time=start_time,
            end_time=end_time
        )

        # 4. Audit
        log_action(
            action="blackout.created",
            actor=actor,
            resource_type="BlackoutDate",
            resource_id=str(blackout.id),
            metadata={
                "technician_id": str(technician_id),
                "start_time": start_time.isoformat(),
                "end_time": end_time.isoformat()
            }
        )

        # 5. Event
        transaction.on_commit(lambda: BookingEventPublisher.publish_blackout_created(
            technician_id=str(technician_id),
            blackout_id=str(blackout.id),
            correlation_id=correlation_id,
            actor_id=str(actor.id)
        ))

        return blackout

    @staticmethod
    @transaction.atomic
    def delete_blackout_date(blackout_id: str, actor: Any, correlation_id: str = "") -> bool:
        """
        Deletes a blackout date.
        Source: booking-service-design.md Section 5.3
        """
        try:
            blackout = BlackoutDate.objects.get(id=blackout_id)
        except BlackoutDate.DoesNotExist:
            raise ValidationError("Blackout date does not exist.")

        # 1. Permission Check
        if not BookingPermissionChecker.can_manage_blackout_dates(actor.role, user=actor, blackout_date=blackout):
            raise PermissionDenied("Unauthorized to manage blackout dates.")

        technician_id = str(blackout.technician_id)

        # 2. Delete
        blackout.delete()

        # 3. Audit
        log_action(
            action="blackout.deleted",
            actor=actor,
            resource_type="BlackoutDate",
            resource_id=blackout_id,
            metadata={
                "technician_id": technician_id
            }
        )

        # 4. Event
        transaction.on_commit(lambda b_id=blackout_id, t_id=technician_id, c_id=correlation_id: 
            BookingEventPublisher.publish_blackout_deleted(
                technician_id=t_id,
                blackout_id=b_id,
                correlation_id=c_id,
                actor_id=str(actor.id)
            )
        )

        return True
