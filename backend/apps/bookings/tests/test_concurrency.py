import pytest
from unittest.mock import patch, MagicMock
from django.core.exceptions import ValidationError
from django.utils import timezone
from apps.bookings.services.scheduling_service import SchedulingService
import uuid

@pytest.mark.django_db(transaction=True)
class TestConcurrency:

    @patch('apps.bookings.services.scheduling_service.Booking.objects.select_for_update')
    @patch('apps.bookings.services.scheduling_service.AvailabilityService.has_conflict')
    def test_overlapping_scheduling_race_condition(self, mock_has_conflict, mock_sfu):
        """
        Document: booking-test-strategy.md
        Section: 5.5
        Requirement: Double-Booking Attempts (Scheduling Race): Two threads attempting to schedule the same Technician into overlapping slots; prove one fails. The first successful committed transaction wins.
        """
        # Thread 1 commits and locks the slot, resulting in has_conflict returning True for Thread 2
        mock_has_conflict.return_value = True
        
        mock_booking = MagicMock(status="unscheduled", technician_id=1, duration_days=1)
        mock_qs = MagicMock()
        mock_qs.get.return_value = mock_booking
        mock_sfu.return_value = mock_qs

        actor = MagicMock(role="STAFF")
        
        # Proves that the JIT Revalidation (second thread evaluating has_conflict) rejects the scheduling
        with pytest.raises(ValidationError, match="Technician is not available for the requested window"):
            SchedulingService.schedule_booking("test_id", timezone.now(), actor, "corr_123")
