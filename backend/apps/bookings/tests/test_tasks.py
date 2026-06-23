import pytest
from unittest.mock import patch, MagicMock
from django.utils import timezone
from datetime import timedelta
import uuid

from apps.bookings.models.booking import Booking
from apps.bookings.tasks.no_show_tasks import run_no_show_monitor
from apps.bookings.tasks.reminder_tasks import run_reminder_dispatcher

@pytest.mark.django_db
class TestBookingBackgroundJobs:

    def setUp(self):
        pass

    @patch('apps.bookings.tasks.no_show_tasks.NoShowService.report_no_show')
    def test_no_show_monitor_2_hour_threshold(self, mock_report):
        now = timezone.now()
        
        # Booking 1: 3 hours ago -> Should be picked up
        b1 = Booking.objects.create(
            request_id=uuid.uuid4(),
            technician_id=1, # Mock ID
            status=Booking.Status.SCHEDULED,
            start_time=now - timedelta(hours=3),
            end_time=now - timedelta(hours=2)
        )
        
        # Booking 2: 1 hour ago -> Should NOT be picked up
        b2 = Booking.objects.create(
            request_id=uuid.uuid4(),
            technician_id=1,
            status=Booking.Status.SCHEDULED,
            start_time=now - timedelta(hours=1),
            end_time=now + timedelta(hours=1)
        )

        # Booking 3: Already processed (NO_SHOW) -> Should NOT be picked up
        b3 = Booking.objects.create(
            request_id=uuid.uuid4(),
            technician_id=1,
            status=Booking.Status.NO_SHOW,
            start_time=now - timedelta(hours=4),
            end_time=now - timedelta(hours=3)
        )

        processed = run_no_show_monitor()

        assert processed == 1
        mock_report.assert_called_once()
        args, kwargs = mock_report.call_args
        assert kwargs['booking_id'] == str(b1.id)

    @patch('apps.bookings.tasks.reminder_tasks.BookingEventPublisher.publish_booking_reminder_sent')
    @patch('apps.bookings.tasks.reminder_tasks.log_action')
    def test_reminder_dispatcher_idempotency(self, mock_log, mock_publish):
        now = timezone.now()

        # 24h reminder booking (starts 23.5 hours from now)
        b_24 = Booking.objects.create(
            request_id=uuid.uuid4(),
            technician_id=1,
            status=Booking.Status.SCHEDULED,
            start_time=now + timedelta(hours=23, minutes=30),
            end_time=now + timedelta(hours=24, minutes=30)
        )

        # 3h reminder booking (starts 2.5 hours from now)
        b_3 = Booking.objects.create(
            request_id=uuid.uuid4(),
            technician_id=1,
            status=Booking.Status.SCHEDULED,
            start_time=now + timedelta(hours=2, minutes=30),
            end_time=now + timedelta(hours=3, minutes=30)
        )

        # Run 1: Should send both
        sent = run_reminder_dispatcher()
        assert sent == 2
        assert mock_publish.call_count == 2
        assert mock_log.call_count == 2
        
        # Verify 24h and 3h were sent
        calls = mock_publish.call_args_list
        types = [call[1]['reminder_type'] for call in calls]
        assert '24h' in types
        assert '3h' in types

        # Check DB updates
        b_24.refresh_from_db()
        b_3.refresh_from_db()
        assert b_24.last_reminder_sent is not None
        assert b_3.last_reminder_sent is not None

        # Run 2: Should send NOTHING (Idempotency)
        mock_publish.reset_mock()
        mock_log.reset_mock()
        
        sent2 = run_reminder_dispatcher()
        assert sent2 == 0
        assert mock_publish.call_count == 0
        assert mock_log.call_count == 0

    @patch('apps.bookings.tasks.reminder_tasks.BookingEventPublisher.publish_booking_reminder_sent')
    @patch('apps.bookings.tasks.reminder_tasks.log_action')
    def test_reminder_3h_sent_after_24h(self, mock_log, mock_publish):
        now = timezone.now()

        # A booking that had a 24h reminder sent 21 hours ago
        b_3 = Booking.objects.create(
            request_id=uuid.uuid4(),
            technician_id=1,
            status=Booking.Status.SCHEDULED,
            start_time=now + timedelta(hours=2, minutes=30),
            end_time=now + timedelta(hours=3, minutes=30),
            last_reminder_sent=now - timedelta(hours=21)
        )

        sent = run_reminder_dispatcher()
        
        assert sent == 1
        mock_publish.assert_called_once()
        assert mock_publish.call_args[1]['reminder_type'] == '3h'
        
        b_3.refresh_from_db()
        assert b_3.last_reminder_sent > now - timedelta(minutes=1)
