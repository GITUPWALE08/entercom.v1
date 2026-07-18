import logging
from datetime import datetime, timedelta
from typing import Optional, Any
from django.db import transaction
from django.core.exceptions import ValidationError, PermissionDenied
from django.utils import timezone

from ..models.booking import Booking
from .availability_service import AvailabilityService
from ..permissions.checkers import BookingPermissionChecker
from ..permissions.constants import Roles
from ..events.publishers import BookingEventPublisher
from apps.audit_logs.services.audit_service import log_action
from apps.notification.services import DispatchOrchestrator

logger = logging.getLogger(__name__)

class BookingService:
    """
    Orchestrates the creation and overarching lifecycle transitions of a Booking entity.
    """

    @staticmethod
    @transaction.atomic
    def create_unscheduled_booking(request_id: str, technician_id: str, duration_days: int, actor: Any = None, correlation_id: str = "") -> Booking:
        """
        Instantiates an unscheduled booking. 
        Triggered by Technician assignment acceptance in Request domain.
        Source: scheduling-flow.md Section 5.1
        """
        # 1. Permission Check
        role = getattr(actor, 'role', Roles.SYSTEM)
        if not BookingPermissionChecker.can_create_booking(role):
            raise PermissionDenied("Only System can create bookings.")

        # 2. Validation
        if Booking.objects.filter(request_id=request_id).exists():
            raise ValidationError("A booking already exists for this request.")

        # 3. State Change
        booking = Booking.objects.create(
            request_id=request_id,
            technician_id=technician_id,
            duration_days=duration_days,
            status=Booking.Status.UNSCHEDULED
        )
        
        # 4. Audit
        log_action(
            action="booking.created",
            actor=actor,
            resource_type="Booking",
            resource_id=str(booking.id),
            metadata={
                "request_id": str(request_id),
                "technician_id": str(technician_id),
                "duration_days": duration_days,
                "trigger_event": "assignment.accepted"
            }
        )

        # 5. Event
        transaction.on_commit(lambda: BookingEventPublisher.publish_booking_created(
            booking_id=str(booking.id),
            request_id=str(request_id),
            correlation_id=correlation_id,
            actor_id=str(getattr(actor, 'id', 'SYSTEM'))
        ))

        transaction.on_commit(lambda: DispatchOrchestrator.dispatch_event(
            event_type="booking_confirmed",
            recipient_id=technician_id,
            resource_type="booking",
            resource_id=str(booking.id),
            category="updates",
            title="Booking Confirmed",
            message="A new booking has been confirmed.",
            context={"duration_days": duration_days},
            is_system_critical=False,
        ))

        logger.info(f"Created unscheduled Booking {booking.id} for Request {request_id}")
        return booking

    @staticmethod
    @transaction.atomic
    def start_booking(booking_id: str, actor: Any, correlation_id: str = "") -> Booking:
        """
        Transitions a booking to in_progress.
        Source: booking-lifecycle.md Section 6
        """
        # 1. Fetch
        booking = Booking.objects.select_for_update().get(id=booking_id)

        # 2. Permission Check
        if not BookingPermissionChecker.can_start_booking(actor.role, user=actor, booking=booking):
            raise PermissionDenied("Unauthorized to start this booking.")

        # 3. Validation
        if booking.status != Booking.Status.SCHEDULED:
            raise ValidationError(f"Cannot start booking in state: {booking.status}")

        # 4. State Change
        booking.status = Booking.Status.IN_PROGRESS
        booking.started_at = timezone.now()
        booking.save()

        # 5. Audit
        log_action(
            action="booking.in_progress",
            actor=actor,
            resource_type="Booking",
            resource_id=str(booking.id),
            metadata={
                "started_at": booking.started_at.isoformat(),
                "location_verified": True  # Requirement from audit-spec
            }
        )

        # 6. Event
        transaction.on_commit(lambda: BookingEventPublisher.publish_booking_in_progress(
            booking_id=str(booking.id),
            request_id=str(booking.request_id),
            correlation_id=correlation_id,
            actor_id=str(actor.id),
            started_at=booking.started_at.isoformat()
        ))

        # [DEFERRED] Non-MVP event
        # transaction.on_commit(lambda: DispatchOrchestrator.dispatch_event(
        #     event_type="job_started",
        #     recipient_id=actor.id,
        #     resource_type="booking",
        #     resource_id=str(booking.id),
        #     category="updates",
        #     title="Job Started",
        #     message="Your job has started.",
        #     context={},
        #     is_system_critical=False,
        # ))

        logger.info(f"Booking {booking_id} started by {actor.id}")
        return booking

    @staticmethod
    @transaction.atomic
    def extend_duration(booking_id: str, new_duration_days: int, actor: Any, correlation_id: str = "") -> Booking:
        """
        Updates the estimated duration of a booking.
        Source: scheduling-flow.md Section 5.3
        """
        # 1. Fetch
        booking = Booking.objects.select_for_update().get(id=booking_id)

        # 2. Permission Check
        if not BookingPermissionChecker.can_extend_booking(actor.role, user=actor, booking=booking):
            raise PermissionDenied("Unauthorized to extend this booking duration.")

        # 3. Validation
        if booking.status not in [Booking.Status.SCHEDULED, Booking.Status.IN_PROGRESS]:
            raise ValidationError("Duration can only be extended for scheduled or in-progress bookings.")

        if new_duration_days <= (booking.duration_days or 0):
            raise ValidationError("New duration must be greater than current duration.")

        # Calculate new end time
        new_end_time = booking.start_time + timedelta(days=new_duration_days)

        # Conflict Rule: Extensions that conflict are Hard Rejected.
        if AvailabilityService.has_conflict(booking.technician_id, booking.start_time, new_end_time, exclude_booking_id=booking_id):
            raise ValidationError("Duration extension conflicts with existing commitments.")

        prev_duration = booking.duration_days
        
        # 4. State Change
        booking.duration_days = new_duration_days
        booking.end_time = new_end_time
        booking.save()

        # 5. Audit
        log_action(
            action="booking.duration_extended",
            actor=actor,
            resource_type="Booking",
            resource_id=str(booking.id),
            metadata={
                "previous_duration_days": prev_duration,
                "new_duration_days": new_duration_days
            }
        )

        # 6. Event
        transaction.on_commit(lambda: BookingEventPublisher.publish_booking_duration_extended(
            booking_id=str(booking.id),
            request_id=str(booking.request_id),
            correlation_id=correlation_id,
            actor_id=str(actor.id),
            previous_duration=prev_duration,
            new_duration=new_duration_days
        ))

        logger.info(f"Booking {booking_id} duration extended to {new_duration_days} days by {actor.id}")
        return booking

    @staticmethod
    @transaction.atomic
    def sync_completion(booking_id: str, actor: Any = None, correlation_id: str = "") -> Booking:
        """
        Automatically completes a booking when the parent Request is completed.
        Source: booking-lifecycle.md Section 5.6
        """
        # 1. Fetch
        booking = Booking.objects.select_for_update().get(id=booking_id)
        
        # 2. State Change
        booking.status = Booking.Status.COMPLETED
        booking.save()

        # 3. Audit
        log_action(
            action="booking.completed",
            actor=actor,
            resource_type="Booking",
            resource_id=str(booking.id),
            metadata={
                "trigger_reason": "request_completed"
            }
        )

        # 4. Event
        transaction.on_commit(lambda: BookingEventPublisher.publish_booking_completed(
            booking_id=str(booking.id),
            request_id=str(booking.request_id),
            correlation_id=correlation_id,
            actor_id=str(getattr(actor, 'id', 'SYSTEM'))
        ))

        # [DEFERRED] Non-MVP event
        # transaction.on_commit(lambda: DispatchOrchestrator.dispatch_event(
        #     event_type="job_completed",
        #     recipient_id=booking.technician_id,
        #     resource_type="booking",
        #     resource_id=str(booking.id),
        #     category="updates",
        #     title="Job Completed",
        #     message="Your job has been marked as completed.",
        #     context={},
        #     is_system_critical=False,
        # ))

        logger.info(f"Booking {booking_id} synced to COMPLETED")
        return booking

    @staticmethod
    @transaction.atomic
    def sync_cancellation(booking_id: str, actor: Any = None, correlation_id: str = "") -> Booking:
        """
        Terminates a booking as a downstream effect of Request cancellation.
        Source: booking-lifecycle.md Section 5.3
        """
        # 1. Fetch
        booking = Booking.objects.select_for_update().get(id=booking_id)
        
        if booking.status in [Booking.Status.COMPLETED, Booking.Status.CANCELLED, Booking.Status.NO_SHOW]:
            return booking # Already terminal

        # 2. State Change
        booking.status = Booking.Status.CANCELLED
        booking.save()

        # 3. Audit
        log_action(
            action="booking.cancelled",
            actor=actor,
            resource_type="Booking",
            resource_id=str(booking.id),
            metadata={
                "trigger_reason": "request_cancelled",
                "refund_verified": True  # Requirement from audit-spec
            }
        )

        # 4. Event
        transaction.on_commit(lambda: BookingEventPublisher.publish_booking_cancelled(
            booking_id=str(booking.id),
            request_id=str(booking.request_id),
            correlation_id=correlation_id,
            actor_id=str(getattr(actor, 'id', 'SYSTEM'))
        ))

        logger.info(f"Booking {booking_id} synced to CANCELLED")
        return booking
