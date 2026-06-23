from rest_framework import permissions

from apps.roles.models import UserRole
from apps.bookings.permissions.checkers import BookingPermissionChecker
from apps.bookings.models.booking import Booking

class IsBookingViewer(permissions.BasePermission):
    """
    Grants access if the user can view the specific booking.
    """
    def has_object_permission(self, request, view, obj):
        # We assume obj is a Booking
        role = getattr(request.user, 'role', '')
        # Checker requires Role enum or string that matches
        # but checker implementation handles strings
        return BookingPermissionChecker.can_view_calendar(role, user=request.user, booking=obj)

class CanManageWorkingHours(permissions.BasePermission):
    """
    Grants access if the user can manage the technician's working hours.
    """
    def has_permission(self, request, view):
        # The target_technician_id is typically in the URL kwarg
        technician_id = view.kwargs.get('technician_id')
        role = getattr(request.user, 'role', '')
        
        # Superadmin / Manager can manage any. Tech can manage self.
        if role in [UserRole.SUPER_ADMIN, UserRole.MANAGER]:
            return True
        if role == UserRole.TECHNICIAN:
            return str(request.user.id) == str(technician_id)
        return False

class CanManageBlackouts(permissions.BasePermission):
    """
    Grants access if the user can manage the technician's blackout dates.
    """
    def has_permission(self, request, view):
        technician_id = view.kwargs.get('technician_id')
        role = getattr(request.user, 'role', '')
        
        return BookingPermissionChecker.can_manage_blackouts(role, user=request.user, target_technician_id=technician_id)

class CanScheduleBooking(permissions.BasePermission):
    def has_permission(self, request, view):
        role = getattr(request.user, 'role', '')
        return BookingPermissionChecker.can_schedule_booking(role)

class CanRescheduleBooking(permissions.BasePermission):
    def has_object_permission(self, request, view, obj):
        role = getattr(request.user, 'role', '')
        return BookingPermissionChecker.can_reschedule_booking(role, user=request.user, booking=obj)

class CanExtendBooking(permissions.BasePermission):
    def has_object_permission(self, request, view, obj):
        role = getattr(request.user, 'role', '')
        return BookingPermissionChecker.can_extend_booking(role, user=request.user, booking=obj)

class CanReportNoShow(permissions.BasePermission):
    def has_object_permission(self, request, view, obj):
        role = getattr(request.user, 'role', '')
        return BookingPermissionChecker.can_report_no_show(role, user=request.user, booking=obj)
