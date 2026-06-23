class BookingPermissions:
    CREATE = "booking.create"
    SCHEDULE = "booking.schedule"
    RESCHEDULE = "booking.reschedule"
    START = "booking.start"
    EXTEND = "booking.extend"
    NO_SHOW = "booking.no_show"
    CANCEL = "booking.cancel"
    VIEW_CALENDAR = "calendar.view"
    MANAGE_HOURS = "calendar.manage_hours"
    MANAGE_BLACKOUTS = "calendar.manage_blackouts"

class Roles:
    CUSTOMER = "CUSTOMER"
    TECHNICIAN = "TECHNICIAN"
    STAFF = "STAFF"
    MANAGER = "MANAGER"
    SUPERADMIN = "SUPER_ADMIN"
    SYSTEM = "System"
