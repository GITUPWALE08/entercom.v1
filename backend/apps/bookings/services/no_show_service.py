import logging
from django.db import transaction
from django.core.exceptions import ValidationError, PermissionDenied
from django.utils import timezone
from typing import Any

from ..models.booking import Booking
from ..models.no_show_record import NoShowRecord
from ..permissions.checkers import BookingPermissionChecker
from ..events.publishers import BookingEventPublisher
from apps.audit_logs.services.audit_service import log_action

logger = logging.getLogger(__name__)

class NoShowService:
    """
    Processes and records the terminal absence of a required party.
    Enforces the mandatory 2-hour grace period.
    """

    @staticmethod
    @transaction.atomic
    def report_no_show(booking_id: str, absent_party: str, actor: Any, correlation_id: str = "") -> Booking:
        """
        Transitions a booking to no_show state.
        Source: no-show-policy.md Section 5
        """
        # 1. Fetch and Lock Booking
        booking = Booking.objects.select_for_update().get(id=booking_id)

        # 2. Permission Check
        if not BookingPermissionChecker.can_report_no_show(actor.role, user=actor, booking=booking):
            raise PermissionDenied("Unauthorized to report no-show for this booking.")

        # 3. Validation
        if booking.status not in [Booking.Status.SCHEDULED, Booking.Status.IN_PROGRESS]:
            raise ValidationError(f"Cannot report no-show for booking in status: {booking.status}")

        # 4. Enforce 2-hour grace period
        now = timezone.now()
        grace_period_threshold = booking.start_time + timezone.timedelta(hours=2)
        
        if now < grace_period_threshold:
            remaining_mins = int((grace_period_threshold - now).total_seconds() / 60)
            raise ValidationError(f"No-show cannot be declared yet. Please wait {remaining_mins} more minutes.")

        # 5. Capture Audit Delta (NoShowRecord)
        NoShowRecord.objects.create(
            booking=booking,
            actor=actor,
            correlation_id=correlation_id,
            absent_party=absent_party,
            declared_at=now
        )

        # 6. State Change
        booking.status = Booking.Status.NO_SHOW
        booking.save()

        # 7. Audit (Centralized Audit Log)
        log_action(
            action="booking.no_show",
            actor=actor,
            resource_type="Booking",
            resource_id=str(booking.id),
            metadata={
                "absent_party": absent_party,
                "waiting_period_met": True,
                "grace_period_mins": 120
            }
        )

        # 8. Event
        transaction.on_commit(lambda: BookingEventPublisher.publish_booking_no_show(
            booking_id=str(booking.id),
            request_id=str(booking.request_id),
            correlation_id=correlation_id,
            actor_id=str(actor.id),
            absent_party=absent_party,
            declared_at=now.isoformat()
        ))

        logger.info(f"Booking {booking_id} marked as NO_SHOW (Absent: {absent_party}) by {actor.id}")
        return booking
