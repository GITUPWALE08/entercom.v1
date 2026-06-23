import logging
from celery import shared_task
from django.db import transaction
from django.utils import timezone
from datetime import timedelta

from ..models.booking import Booking
from ..services.no_show_service import NoShowService

logger = logging.getLogger(__name__)

class SystemActor:
    id = "SYSTEM"
    role = "System"

@shared_task(
    name="apps.bookings.tasks.no_show_monitor",
    bind=True,
    max_retries=3,
    default_retry_delay=60
)
def run_no_show_monitor(self):
    """
    Enforces the "No-Show Results in Cancellation" rule by identifying stale appointments.
    Trigger: Scheduled hourly sweep.
    Source: booking-background-jobs.md Section 5.1.1
    """
    now = timezone.now()
    # Scans for scheduled bookings where current_time > start_time + 2 hours
    threshold = now - timedelta(hours=2)

    # Use select_for_update(skip_locked=True) to prevent multiple worker nodes 
    # from processing the same terminal transition simultaneously.
    # Source: booking-background-jobs.md Section 5.2
    stale_bookings = Booking.objects.select_for_update(skip_locked=True).filter(
        status=Booking.Status.SCHEDULED,
        start_time__lte=threshold
    )

    processed_count = 0
    system_actor = SystemActor()

    with transaction.atomic():
        for booking in stale_bookings:
            try:
                # Note: NoShowService internally handles audit logging and event emission.
                # We use SystemActor for autonomous processes.
                NoShowService.report_no_show(
                    booking_id=str(booking.id),
                    absent_party="unspecified", # Job cannot determine who is absent, marks as terminal
                    actor=system_actor,
                    correlation_id=f"job-noshow-{now.strftime('%Y%m%d%H')}"
                )
                processed_count += 1
            except Exception as exc:
                logger.error(f"Failed to process no-show for booking {booking.id}: {exc}")
                # We don't fail the whole job, just log and continue to next booking
                continue

    logger.info(f"No-Show Monitor complete. Processed {processed_count} bookings.")
    return processed_count
