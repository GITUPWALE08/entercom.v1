from dataclasses import dataclass
from typing import Optional, List, Dict, Any

# Lifecycle Payloads
@dataclass(frozen=True)
class RequestCreatedPayload:
    request_id: int
    customer_id: int
    category: str

@dataclass(frozen=True)
class RequestUpdatedPayload:
    request_id: int
    updates: Dict[str, Any]

@dataclass(frozen=True)
class RequestSubmittedPayload:
    request_id: int
    priority: str
    category: str

@dataclass(frozen=True)
class RequestStatusChangedPayload:
    request_id: int
    prev_status: str
    new_status: str

@dataclass(frozen=True)
class RequestCancelledPayload:
    request_id: int
    actor_id: int
    reason_code: str

# Quote Payloads
@dataclass(frozen=True)
class QuoteCreatedPayload:
    quote_id: int
    version: int
    amount: float

@dataclass(frozen=True)
class QuoteApprovedPayload:
    quote_id: int
    request_id: int
    customer_id: int

@dataclass(frozen=True)
class QuoteRejectedPayload:
    quote_id: int
    reason_code: str

@dataclass(frozen=True)
class QuoteRevisionRequestedPayload:
    quote_id: int
    revision_notes: str

@dataclass(frozen=True)
class QuoteExpiredPayload:
    quote_id: int
    request_id: int

# Assignment Payloads
@dataclass(frozen=True)
class RequestAssignedPayload:
    request_id: int
    technician_id: int

@dataclass(frozen=True)
class AssignmentAcceptedPayload:
    request_id: int
    technician_id: int
    timestamp: str

@dataclass(frozen=True)
class AssignmentDeclinedPayload:
    request_id: int
    reason_code: str

@dataclass(frozen=True)
class AssignmentTimeoutPayload:
    request_id: int
    technician_id: int

# Verification Payloads
@dataclass(frozen=True)
class VerificationSubmittedPayload:
    request_id: int
    evidence_links: List[str]

@dataclass(frozen=True)
class VerificationApprovedPayload:
    request_id: int
    staff_id: int

@dataclass(frozen=True)
class VerificationRejectedPayload:
    request_id: int
    rework_notes: str

@dataclass(frozen=True)
class VerificationOverriddenPayload:
    request_id: int
    manager_id: int
    reason: str

# Escalation Payloads
@dataclass(frozen=True)
class EscalationTriggeredPayload:
    request_id: int
    trigger_type: str

@dataclass(frozen=True)
class EscalationResolvedPayload:
    request_id: int
    resolution_type: str

# SLA Payloads
@dataclass(frozen=True)
class SLAWarningPayload:
    request_id: int
    priority: str
    time_left: str

@dataclass(frozen=True)
class SLABreachedPayload:
    request_id: int
    priority: str
    delay: str
