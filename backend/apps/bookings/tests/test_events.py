import pytest
from unittest.mock import patch
from apps.bookings.events.publishers import BookingEventPublisher
from apps.bookings.events.types import BookingEventName

class TestBookingEvents:
    """
    Document: booking-test-strategy.md
    Section: 5.6
    Requirement: Contract Validation: Prove emitted payloads match booking-event-contracts.md exactly.
    """
    
    @patch('apps.bookings.events.publishers.BookingEventPublisher._publish')
    def test_booking_created_payload(self, mock_publish):
        BookingEventPublisher.publish_booking_created(
            booking_id="b1", request_id="r1", correlation_id="c1", actor_id="a1"
        )
        event = mock_publish.call_args[0][0]
        assert event.event_name == BookingEventName.CREATED.value
        assert event.event_version == "v1"
        assert event.correlation_id == "c1"
        assert event.actor_id == "a1"
        assert event.data.booking_id == "b1"
        assert event.data.status == "unscheduled"

    @patch('apps.bookings.events.publishers.BookingEventPublisher._publish')
    def test_booking_scheduled_payload(self, mock_publish):
        BookingEventPublisher.publish_booking_scheduled(
            booking_id="b1", request_id="r1", correlation_id="c1", actor_id="a1",
            technician_id="t1", start_time="2026-01-01T10:00:00Z", end_time="2026-01-01T12:00:00Z", duration_days=1
        )
        event = mock_publish.call_args[0][0]
        assert event.event_name == BookingEventName.SCHEDULED.value
        assert event.data.technician_id == "t1"
        assert event.data.duration_days == 1

    @patch('apps.bookings.events.publishers.BookingEventPublisher._publish')
    def test_booking_rescheduled_payload(self, mock_publish):
        BookingEventPublisher.publish_booking_rescheduled(
            booking_id="b1", request_id="r1", correlation_id="c1", actor_id="a1",
            previous_start_time="old", new_start_time="new_start", new_end_time="new_end", reschedule_count=2
        )
        event = mock_publish.call_args[0][0]
        assert event.event_name == BookingEventName.RESCHEDULED.value
        assert event.data.reschedule_count == 2

    @patch('apps.bookings.events.publishers.BookingEventPublisher._publish')
    def test_booking_duration_extended_payload(self, mock_publish):
        BookingEventPublisher.publish_booking_duration_extended(
            booking_id="b1", request_id="r1", correlation_id="c1", actor_id="a1",
            previous_duration=1, new_duration=3
        )
        event = mock_publish.call_args[0][0]
        assert event.event_name == BookingEventName.DURATION_EXTENDED.value
        assert event.data.new_duration_days == 3

    @patch('apps.bookings.events.publishers.BookingEventPublisher._publish')
    def test_booking_in_progress_payload(self, mock_publish):
        BookingEventPublisher.publish_booking_in_progress(
            booking_id="b1", request_id="r1", correlation_id="c1", actor_id="a1", started_at="now"
        )
        event = mock_publish.call_args[0][0]
        assert event.event_name == BookingEventName.IN_PROGRESS.value

    @patch('apps.bookings.events.publishers.BookingEventPublisher._publish')
    def test_booking_completed_payload(self, mock_publish):
        BookingEventPublisher.publish_booking_completed("b1", "r1", "c1", "a1")
        event = mock_publish.call_args[0][0]
        assert event.event_name == BookingEventName.COMPLETED.value

    @patch('apps.bookings.events.publishers.BookingEventPublisher._publish')
    def test_booking_cancelled_payload(self, mock_publish):
        BookingEventPublisher.publish_booking_cancelled("b1", "r1", "c1", "a1")
        event = mock_publish.call_args[0][0]
        assert event.event_name == BookingEventName.CANCELLED.value

    @patch('apps.bookings.events.publishers.BookingEventPublisher._publish')
    def test_booking_no_show_payload(self, mock_publish):
        BookingEventPublisher.publish_booking_no_show("b1", "r1", "c1", "a1", "customer", "now")
        event = mock_publish.call_args[0][0]
        assert event.event_name == BookingEventName.NO_SHOW.value
        assert event.data.absent_party == "customer"

    @patch('apps.bookings.events.publishers.BookingEventPublisher._publish')
    def test_booking_reminder_sent_payload(self, mock_publish):
        BookingEventPublisher.publish_booking_reminder_sent("b1", "r1", "c1", "a1", "24h", "BOTH")
        event = mock_publish.call_args[0][0]
        assert event.event_name == BookingEventName.REMINDER_SENT.value
        assert event.data.reminder_type == "24h"

    @patch('apps.bookings.events.publishers.BookingEventPublisher._publish')
    def test_availability_working_hours_updated_payload(self, mock_publish):
        BookingEventPublisher.publish_working_hours_updated("t1", "c1", "a1", {"mon": "ok"})
        event = mock_publish.call_args[0][0]
        assert event.event_name == BookingEventName.WORKING_HOURS_UPDATED.value
        assert event.data.technician_id == "t1"
