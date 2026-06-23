from enum import Enum

class EventName(str, Enum):
    # Lifecycle Events
    REQUEST_CREATED = "request.created"
    REQUEST_UPDATED = "request.updated"
    REQUEST_SUBMITTED = "request.submitted"
    REQUEST_STATUS_CHANGED = "request.status_changed"
    REQUEST_CANCELLED = "request.cancelled"
    
    # Quote Events
    QUOTE_CREATED = "quote.created"
    QUOTE_APPROVED = "quote.approved"
    QUOTE_REJECTED = "quote.rejected"
    QUOTE_REVISION_REQUESTED = "quote.revision_requested"
    QUOTE_EXPIRED = "quote.expired"
    
    # Assignment Events
    REQUEST_ASSIGNED = "request.assigned"
    ASSIGNMENT_ACCEPTED = "assignment.accepted"
    ASSIGNMENT_DECLINED = "assignment.declined"
    ASSIGNMENT_TIMEOUT = "assignment.timeout"
    
    # Verification Events
    VERIFICATION_SUBMITTED = "verification.submitted"
    VERIFICATION_APPROVED = "verification.approved"
    VERIFICATION_REJECTED = "verification.rejected"
    VERIFICATION_OVERRIDDEN = "verification.overridden"
    
    # Escalation Events
    ESCALATION_TRIGGERED = "escalation.triggered"
    ESCALATION_RESOLVED = "escalation.resolved"
    
    # SLA Events
    SLA_WARNING = "sla.warning"
    SLA_BREACHED = "sla.breached"
