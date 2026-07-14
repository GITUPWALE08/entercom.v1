import pytest
from django.core.exceptions import ValidationError, PermissionDenied
from django.utils import timezone
from datetime import timedelta
from unittest.mock import patch, MagicMock
import uuid
from django.contrib.auth import get_user_model

User = get_user_model()

@pytest.fixture
def tech_user():
    return User.objects.create(email="tech@test.com")

@pytest.fixture
def request_obj(tech_user):
    return Request.objects.create(
        public_id="REQ-123",
        customer=tech_user,
        category="installation",
        priority="normal",
        status="draft",
        description="test",
        assigned_technician=tech_user
    )


from apps.bookings.services.scheduling_service import SchedulingService
from apps.bookings.services.booking_service import BookingService
from apps.bookings.services.no_show_service import NoShowService
from apps.bookings.services.availability_service import AvailabilityService
from apps.bookings.models.booking import Booking
from apps.requests.models.request import Request
from apps.bookings.permissions.constants import Roles

@pytest.mark.django_db(transaction=True)
class TestBookingServices:
    
    @patch('apps.bookings.services.booking_service.log_action')
    @patch('apps.bookings.services.booking_service.BookingEventPublisher.publish_booking_in_progress')
    def test_start_booking_service(self, mock_event, mock_audit, tech_user, request_obj):
        """
        Document: booking-test-strategy.md
        Section: 6.2
        Requirement: Services | 100% | State + Audit + Event
        """
        actor = MagicMock(role=Roles.TECHNICIAN, id=tech_user.id)
        booking = Booking.objects.create(request_id=request_obj.id, technician_id=tech_user.id, status=Booking.Status.SCHEDULED)
        
        updated_booking = BookingService.start_booking(str(booking.id), actor)
        
        # Verify State
        assert updated_booking.status == Booking.Status.IN_PROGRESS
        assert updated_booking.started_at is not None
        
        # Verify Audit
        mock_audit.assert_called_once()
        assert mock_audit.call_args[1]['action'] == "booking.in_progress"
        assert mock_audit.call_args[1]['metadata']['location_verified'] is True
        
        # Verify Event
        mock_event.assert_called_once()

    @patch('apps.bookings.services.booking_service.log_action')
    @patch('apps.bookings.services.booking_service.BookingEventPublisher.publish_booking_duration_extended')
    @patch('apps.bookings.services.booking_service.AvailabilityService.has_conflict')
    def test_extend_duration_service(self, mock_conflict, mock_event, mock_audit, tech_user, request_obj):
        mock_conflict.return_value = False
        actor = MagicMock(role=Roles.TECHNICIAN, id=tech_user.id)
        now = timezone.now()
        booking = Booking.objects.create(request_id=request_obj.id, technician_id=tech_user.id, status=Booking.Status.IN_PROGRESS, start_time=now, duration_days=1)
        
        updated_booking = BookingService.extend_duration(str(booking.id), 3, actor)
        
        assert updated_booking.duration_days == 3
        mock_audit.assert_called_once()
        assert mock_audit.call_args[1]['action'] == "booking.duration_extended"
        mock_event.assert_called_once()

    @patch('apps.bookings.services.booking_service.log_action')
    @patch('apps.bookings.services.booking_service.BookingEventPublisher.publish_booking_completed')
    def test_sync_completion_service(self, mock_event, mock_audit, tech_user, request_obj):
        actor = MagicMock(role=Roles.SYSTEM, id="SYSTEM")
        booking = Booking.objects.create(request_id=request_obj.id, technician_id=tech_user.id, status=Booking.Status.IN_PROGRESS)
        
        updated_booking = BookingService.sync_completion(str(booking.id), actor)
        
        assert updated_booking.status == Booking.Status.COMPLETED
        mock_audit.assert_called_once()
        assert mock_audit.call_args[1]['action'] == "booking.completed"
        mock_event.assert_called_once()

    @patch('apps.bookings.services.booking_service.log_action')
    @patch('apps.bookings.services.booking_service.BookingEventPublisher.publish_booking_cancelled')
    def test_sync_cancellation_service(self, mock_event, mock_audit, tech_user, request_obj):
        actor = MagicMock(role=Roles.SYSTEM, id="SYSTEM")
        booking = Booking.objects.create(request_id=request_obj.id, technician_id=tech_user.id, status=Booking.Status.SCHEDULED)
        
        updated_booking = BookingService.sync_cancellation(str(booking.id), actor)
        
        assert updated_booking.status == Booking.Status.CANCELLED
        mock_audit.assert_called_once()
        assert mock_audit.call_args[1]['action'] == "booking.cancelled"
        mock_event.assert_called_once()

    def test_has_conflict(self, tech_user, request_obj):
        """
        Document: booking-test-strategy.md
        Section: 5.3
        Requirement: Add explicit tests for double booking, blackout conflicts.
        """
        now = timezone.now()
        Booking.objects.create(request_id=request_obj.id, technician_id=tech_user.id, status=Booking.Status.SCHEDULED, start_time=now, end_time=now + timedelta(hours=2))
        
        # Conflict exists
        assert AvailabilityService.has_conflict(tech_user.id, now + timedelta(hours=1), now + timedelta(hours=3)) is True
        # Conflict doesn't exist
        assert AvailabilityService.has_conflict(tech_user.id, now + timedelta(hours=3), now + timedelta(hours=4)) is False

    @patch('apps.bookings.services.availability_service.WorkingHours.objects.get')
    def test_get_technician_availability(self, mock_get, tech_user, request_obj):
        """
        Document: booking-test-strategy.md
        Section: 5.1
        Requirement: Verify internal logic of AvailabilityService (spanning days correctly).
        """
        mock_wh = MagicMock()
        # Mocking Monday
        mock_wh.schedule_blob = {"monday": {"active": True, "start_time": "09:00", "end_time": "17:00"}}
        mock_get.return_value = mock_wh
        
        actor = MagicMock(role=Roles.MANAGER)
        target_date = timezone.datetime(2026, 6, 15).date() # A Monday
        
        slots = AvailabilityService.get_technician_availability(tech_user.id, target_date, actor)
        assert len(slots) == 1
        assert slots[0]['start'].strftime("%H:%M") == "09:00"
        assert slots[0]['end'].strftime("%H:%M") == "17:00"

    @patch('apps.bookings.services.availability_service.WorkingHours.objects.get_or_create')
    @patch('apps.bookings.services.availability_service.log_action')
    @patch('apps.bookings.services.availability_service.BookingEventPublisher.publish_working_hours_updated')
    def test_update_working_hours(self, mock_event, mock_audit, mock_goc, tech_user, request_obj):
        actor = MagicMock(role=Roles.MANAGER)
        mock_wh = MagicMock(schedule_blob={})
        mock_goc.return_value = (mock_wh, False)
        
        new_blob = {"tuesday": {"active": True}}
        AvailabilityService.update_working_hours(tech_user.id, new_blob, actor)
        
        assert mock_wh.schedule_blob == new_blob
        mock_audit.assert_called_once()
        assert mock_audit.call_args[1]['action'] == "working_hours.updated"
        mock_event.assert_called_once()

    @patch('apps.bookings.services.availability_service.log_action')
    @patch('apps.bookings.services.availability_service.BookingEventPublisher.publish_blackout_created')
    def test_create_blackout_date(self, mock_event, mock_audit, tech_user, request_obj):
        actor = MagicMock(role=Roles.MANAGER)
        now = timezone.now()
        
        blackout = AvailabilityService.create_blackout_date(tech_user.id, now, now + timedelta(days=1), actor)
        
        assert blackout.technician_id == tech_user.id
        mock_audit.assert_called_once()
        assert mock_audit.call_args[1]['action'] == "blackout.created"
        mock_event.assert_called_once()

    @patch('apps.bookings.services.availability_service.BlackoutDate.objects.get')
    @patch('apps.bookings.services.availability_service.log_action')
    @patch('apps.bookings.services.availability_service.BookingEventPublisher.publish_blackout_deleted')
    def test_delete_blackout_date(self, mock_event, mock_audit, mock_get, tech_user, request_obj):
        actor = MagicMock(role=Roles.MANAGER)
        mock_blackout = MagicMock(technician_id=tech_user.id)
        mock_get.return_value = mock_blackout
        
        result = AvailabilityService.delete_blackout_date("b1", actor)
        
        assert result is True
        mock_blackout.delete.assert_called_once()
        mock_audit.assert_called_once()
        assert mock_audit.call_args[1]['action'] == "blackout.deleted"
        mock_event.assert_called_once()
