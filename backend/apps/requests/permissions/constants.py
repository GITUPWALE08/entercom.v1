from enum import Enum

class Role(str, Enum):
    """Core system roles as defined in the RBAC mapping."""
    CUSTOMER = "CUSTOMER"
    TECHNICIAN = "TECHNICIAN"
    STAFF = "STAFF"
    MANAGER = "MANAGER"
    SUPERADMIN = "SUPER_ADMIN"

class Permission(str, Enum):
    """Granular permissions mapping to specific domain actions."""
    
    # Customer Permissions
    REQUEST_CREATE = "request.create"
    REQUEST_SUBMIT = "request.submit"
    REQUEST_CANCEL = "request.cancel"
    QUOTE_APPROVE = "quote.approve"
    QUOTE_REJECT = "quote.reject"
    QUOTE_REVISE = "quote.revise"
    
    # Technician Permissions
    ASSIGNMENT_ACCEPT = "assignment.accept"
    ASSIGNMENT_DECLINE = "assignment.decline"
    REQUEST_UPDATE = "request.update"
    QUOTE_CREATE = "quote.create"
    VERIFICATION_SUBMIT = "verification.submit"
    
    # Staff Permissions
    REQUEST_TRIAGE = "request.triage"
    REQUEST_ASSIGN = "request.assign"
    VERIFICATION_VERIFY = "verification.verify"
    
    # Manager Permissions
    REQUEST_ESCALATE = "request.escalate"
    ESCALATION_RESOLVE = "escalation.resolve"
    VERIFICATION_OVERRIDE = "verification.override"
    REQUEST_CANCEL_ACTIVE = "request.cancel_active"
    
    # Superadmin Permissions
    SYSTEM_OVERRIDE = "system.override"

class Scope(str, Enum):
    """The extent of a permission's validity."""
    OWNED = "owned"
    ASSIGNED = "assigned"
    GLOBAL = "global"
    UNIVERSAL = "universal"
