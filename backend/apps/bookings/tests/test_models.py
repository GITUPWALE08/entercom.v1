import pytest
from django.core.exceptions import ValidationError
from django.db.utils import IntegrityError
from django.utils import timezone
from datetime import timedelta
import uuid
from apps.bookings.models.booking import Booking

@pytest.mark.django_db
class TestBookingModels:
    
    def test_end_after_start_constraint(self):
        """
        Document: booking-model-design.md
        Section: 5.4
        Requirement: end_time must strictly evaluate as greater than start_time.
        """
        now = timezone.now()
        booking = Booking(
            request_id=uuid.uuid4(),
            technician_id=1,
            start_time=now,
            end_time=now - timedelta(hours=1),
            duration_days=1,
            status=Booking.Status.SCHEDULED
        )
        with pytest.raises((ValidationError, IntegrityError)):
            booking.full_clean()
            booking.save()

    def test_reschedule_limit_constraint(self):
        """
        Document: booking-test-strategy.md
        Section: 5.1
        Requirement: Validate field constraints (e.g., reschedule_count <= 3).
        """
        now = timezone.now()
        booking = Booking(
            request_id=uuid.uuid4(),
            technician_id=1,
            start_time=now,
            end_time=now + timedelta(hours=1),
            duration_days=1,
            reschedule_count=4,
            status=Booking.Status.SCHEDULED
        )
        with pytest.raises((ValidationError, IntegrityError)):
            booking.full_clean()
            booking.save()

    def test_one_booking_per_request(self):
        """
        Document: booking-model-design.md
        Section: 5.1.1
        Requirement: A Request may have only one Booking; a Booking may belong to only one Request.
        """
        req_id = uuid.uuid4()
        Booking.objects.create(request_id=req_id, technician_id=1, status=Booking.Status.UNSCHEDULED)
        
        with pytest.raises((IntegrityError, ValidationError)):
            Booking.objects.create(request_id=req_id, technician_id=2, status=Booking.Status.UNSCHEDULED)
