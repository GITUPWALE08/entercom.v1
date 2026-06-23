def is_booking_owner(user, booking) -> bool:
    """
    IDOR Prevention: Validates if the user is the customer who owns the parent Request.
    Source: booking-permission-mapping.md Section 5.4
    """
    if not user or not booking:
        return False
    return getattr(user, 'id', None) == getattr(getattr(booking, 'request', None), 'customer_id', None)

def is_assigned_technician(user, booking) -> bool:
    """
    IDOR Prevention: Validates if the user is the assigned technician for the booking.
    Source: booking-permission-mapping.md Section 5.4
    """
    if not user or not booking:
        return False
    return getattr(user, 'id', None) == getattr(getattr(booking, 'request', None), 'assigned_technician_id', None)

def is_working_hours_owner(user, working_hours) -> bool:
    """
    IDOR Prevention: Validates if the user owns the working hours.
    Source: booking-permission-mapping.md Section 5.4
    """
    if not user or not working_hours:
        return False
    return getattr(user, 'id', None) == getattr(working_hours, 'technician_id', None)
