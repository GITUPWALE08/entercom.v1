from .constants import Roles
from .ownership import is_booking_owner, is_assigned_technician, is_working_hours_owner

class BookingPermissionChecker:
    """
    Service-layer RBAC boundary enforcement.
    Does NOT contain HTTP request objects, business logic, scheduling logic, or lifecycle logic.
    """

    @staticmethod
    def can_create_booking(actor_role: str) -> bool:
        """
        Only System can create. 
        Source: booking-permission-mapping.md Section 5.3.1
        """
        return actor_role == Roles.SYSTEM

    @staticmethod
    def can_schedule_booking(actor_role: str) -> bool:
        """
        Staff, Manager, Superadmin.
        Source: booking-permission-mapping.md Section 5.3.2
        """
        return actor_role in [Roles.STAFF, Roles.MANAGER, Roles.SUPERADMIN]

    @staticmethod
    def can_reschedule_booking(actor_role: str, user=None, booking=None) -> bool:
        """
        Customer (own), Technician (assigned), Staff, Manager, Superadmin.
        Source: booking-permission-mapping.md Section 5.3.3
        """
        if actor_role in [Roles.STAFF, Roles.MANAGER, Roles.SUPERADMIN]:
            return True
        if actor_role == Roles.CUSTOMER:
            return is_booking_owner(user, booking)
        if actor_role == Roles.TECHNICIAN:
            return is_assigned_technician(user, booking)
        return False

    @staticmethod
    def can_report_no_show(actor_role: str, user=None, booking=None) -> bool:
        """
        Technician (assigned), Staff, Manager, Superadmin, System (Automated Job).
        Source: booking-permission-mapping.md Section 5.3.4
        """
        if actor_role in [Roles.STAFF, Roles.MANAGER, Roles.SUPERADMIN, Roles.SYSTEM]:
            return True
        if actor_role == Roles.TECHNICIAN:
            return is_assigned_technician(user, booking)
        return False

    @staticmethod
    def can_manage_working_hours(actor_role: str, user=None, working_hours=None) -> bool:
        """
        Technician (own), Manager, Superadmin.
        Source: booking-permission-mapping.md Section 5.3.5
        """
        if actor_role in [Roles.MANAGER, Roles.SUPERADMIN]:
            return True
        if actor_role == Roles.TECHNICIAN:
            return is_working_hours_owner(user, working_hours)
        return False

    @staticmethod
    def can_manage_blackout_dates(actor_role: str, user=None, blackout_date=None) -> bool:
        """
        Technician (own), Manager, Superadmin.
        Source: booking-permission-mapping.md Section 5.3.6
        """
        if actor_role in [Roles.MANAGER, Roles.SUPERADMIN]:
            return True
        if actor_role == Roles.TECHNICIAN:
            if not user or not blackout_date:
                return False
            return getattr(user, 'id', None) == getattr(blackout_date, 'technician_id', None)
        return False

    @staticmethod
    def can_start_booking(actor_role: str, user=None, booking=None) -> bool:
        """
        Technician (assigned).
        Source: booking-permission-mapping.md Section 5.3.7
        """
        if actor_role == Roles.TECHNICIAN:
            return is_assigned_technician(user, booking)
        return False

    @staticmethod
    def can_extend_booking(actor_role: str, user=None, booking=None) -> bool:
        """
        Technician (assigned).
        Source: booking-permissions.md Section 5.3
        """
        if actor_role == Roles.TECHNICIAN:
            return is_assigned_technician(user, booking)
        return False

    @staticmethod
    def can_view_calendar(actor_role: str, user=None, booking=None) -> bool:
        """
        Customer (restricted), Technician (own), Staff, Manager, Superadmin.
        Source: booking-permissions.md Section 5.3
        """
        if actor_role in [Roles.STAFF, Roles.MANAGER, Roles.SUPERADMIN]:
            return True
        if actor_role == Roles.CUSTOMER:
            return is_booking_owner(user, booking)
        if actor_role == Roles.TECHNICIAN:
            # For simplicity in checker, we check if they are the assigned tech if a booking is provided
            if booking:
                return is_assigned_technician(user, booking)
            return True # Tech can always view their own base calendar
        return False

    @staticmethod
    def can_cancel_booking(actor_role: str) -> bool:
        """
        System, Manager (Approval).
        Note: Standard cancellation inherits Request rules.
        Source: booking-permissions.md Section 5.4
        """
        return actor_role in [Roles.SYSTEM, Roles.MANAGER, Roles.SUPERADMIN]
