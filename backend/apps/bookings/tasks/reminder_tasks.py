import logging
from celery import shared_task
from django.db import transaction
from django.utils import timezone
from datetime import timedelta

from ..models.booking import Booking
from ..events.publishers import BookingEventPublisher
from apps.audit_logs.services.audit_service import log_action

logger = logging.getLogger(__name__)

class SystemActor:
    id = "SYSTEM"
    role = "System"

@shared_task(
    name="apps.bookings.tasks.reminder_dispatcher",
    bind=True,
    max_retries=3
)
def run_reminder_dispatcher(self):
    """
    Proactively notifies Customers and Technicians of upcoming commitments.
    Schedule: 24h and 3h before start time.
    Source: booking-background-jobs.md Section 5.1.2
    """
    now = timezone.now()
    
    window_24h_start = now + timedelta(hours=23)
    window_24h_end = now + timedelta(hours=24)
    
    window_3h_start = now + timedelta(hours=2)
    window_3h_end = now + timedelta(hours=3)

    sent_count = 0
    system_actor = SystemActor()

    # Process 24-hour reminders
    with transaction.atomic():
        bookings_24h = Booking.objects.select_for_update(skip_locked=True).filter(
            status=Booking.Status.SCHEDULED,
            start_time__range=(window_24h_start, window_24h_end)
        ).exclude(last_reminder_sent__gte=now - timedelta(hours=24))

        for booking in bookings_24h:
            correlation_id = f"job-rem-24h-{booking.id}-{now.strftime('%Y%m%d%H')}"
            
            # Audit Requirement: booking-background-jobs.md 5.1.2
            log_action(
                action="booking.reminder_sent",
                actor=system_actor,
                resource_type="Booking",
                resource_id=str(booking.id),
                metadata={
                    "request_id": str(booking.request_id),
                    "reminder_type": "24h",
                    "recipient_role": "BOTH"
                }
            )

            # Domain Event
            # Using transaction.on_commit to ensure it only publishes if successful
            transaction.on_commit(lambda b_id=str(booking.id), req_id=str(booking.request_id), c_id=correlation_id: 
                BookingEventPublisher.publish_booking_reminder_sent(
                    booking_id=b_id,
                    request_id=req_id,
                    correlation_id=c_id,
                    actor_id="SYSTEM",
                    reminder_type="24h",
                    recipient_role="BOTH"
                )
            )
            
            booking.last_reminder_sent = now
            booking.save(update_fields=['last_reminder_sent'])
            sent_count += 1

    # Process 3-hour reminders
    with transaction.atomic():
        # Exclude bookings that had a reminder in the last 4 hours
        # This prevents sending the 3h reminder multiple times if the job overlaps
        bookings_3h = Booking.objects.select_for_update(skip_locked=True).filter(
            status=Booking.Status.SCHEDULED,
            start_time__range=(window_3h_start, window_3h_end)
        ).exclude(last_reminder_sent__gte=now - timedelta(hours=4))

        for booking in bookings_3h:
            correlation_id = f"job-rem-3h-{booking.id}-{now.strftime('%Y%m%d%H')}"
            
            log_action(
                action="booking.reminder_sent",
                actor=system_actor,
                resource_type="Booking",
                resource_id=str(booking.id),
                metadata={
                    "request_id": str(booking.request_id),
                    "reminder_type": "3h",
                    "recipient_role": "BOTH"
                }
            )

            transaction.on_commit(lambda b_id=str(booking.id), req_id=str(booking.request_id), c_id=correlation_id: 
                BookingEventPublisher.publish_booking_reminder_sent(
                    booking_id=b_id,
                    request_id=req_id,
                    correlation_id=c_id,
                    actor_id="SYSTEM",
                    reminder_type="3h",
                    recipient_role="BOTH"
                )
            )
            
            booking.last_reminder_sent = now
            booking.save(update_fields=['last_reminder_sent'])
            sent_count += 1

    logger.info(f"Reminder Dispatcher complete. Published {sent_count} reminder events.")
    return sent_count
