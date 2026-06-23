import pytest
from apps.bookings.permissions.checkers import BookingPermissionChecker
from apps.bookings.permissions.constants import Roles
from unittest.mock import MagicMock

class TestBookingPermissions:

    def test_unauthorized_reschedule_attempt(self):
        """
        Document: booking-test-strategy.md
        Section: 5.4
        Requirement: Negative Authorization - Unauthorized rescheduling attempt.
        """
        actor = MagicMock(role=Roles.CUSTOMER, id=1)
        booking = MagicMock()
        booking.request.customer_id = 2 # Different customer owns the booking
        assert not BookingPermissionChecker.can_reschedule_booking(actor.role, user=actor, booking=booking)

    def test_unauthorized_duration_extension_attempt(self):
        """
        Document: booking-test-strategy.md
        Section: 5.4
        Requirement: Negative Authorization - Unauthorized duration extension attempt.
        """
        actor = MagicMock(role=Roles.TECHNICIAN, id=1)
        booking = MagicMock()
        booking.request.assigned_technician_id = 2 # Different tech assigned
        assert not BookingPermissionChecker.can_extend_booking(actor.role, user=actor, booking=booking)

    def test_unauthorized_cancellation_attempt(self):
        """
        Document: booking-test-strategy.md
        Section: 5.4
        Requirement: Negative Authorization - Unauthorized cancellation attempt.
        """
        actor = MagicMock(role=Roles.CUSTOMER, id=1) # Only System/Mgr can cancel
        assert not BookingPermissionChecker.can_cancel_booking(actor.role)

    def test_customer_cannot_report_no_show(self):
        """
        Document: booking-permission-mapping.md
        Section: 5.3.4
        Requirement: Denial Conditions: If Customer attempts to declare.
        """
        actor = MagicMock(role=Roles.CUSTOMER, id=1)
        booking = MagicMock()
        assert not BookingPermissionChecker.can_report_no_show(actor.role, user=actor, booking=booking)

    def test_unauthorized_calendar_view_idor(self):
        """
        Document: booking-test-strategy.md
        Section: 5.4
        Requirement: Negative Authorization - Unauthorized calendar view (IDOR).
        """
        actor = MagicMock(role=Roles.CUSTOMER, id=1)
        booking = MagicMock()
        booking.request.customer_id = 2 
        assert not BookingPermissionChecker.can_view_calendar(actor.role, user=actor, booking=booking)
