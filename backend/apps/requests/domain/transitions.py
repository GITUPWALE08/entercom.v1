from typing import Callable, Dict, List, Optional
from dataclasses import dataclass
from .states import RequestState
from .actions import RequestAction

@dataclass
class Transition:
    source: RequestState
    action: RequestAction
    target: RequestState
    required_permission: str
    guard: Optional[Callable[..., bool]] = None

def _has_valid_schema(context: Dict) -> bool:
    return context.get('has_valid_schema', False)

def _staff_assigned(context: Dict) -> bool:
    return context.get('staff_assigned', False)

def _category_requires_quote(context: Dict) -> bool:
    return context.get('category_requires_quote', False)

def _category_skips_quote(context: Dict) -> bool:
    return not _category_requires_quote(context)

def _category_skips_quote_and_payment(context: Dict) -> bool:
    return not _category_requires_quote(context) and not context.get('category_requires_payment', False)

def _has_valid_quote_version(context: Dict) -> bool:
    return context.get('has_valid_quote_version', False)

def _upfront_payment_required(context: Dict) -> bool:
    return context.get('upfront_payment_required', False)

def _no_upfront_payment_required(context: Dict) -> bool:
    return not _upfront_payment_required(context)

def _revision_count_under_limit(context: Dict) -> bool:
    return context.get('revision_count', 0) < 3

def _revision_count_at_limit(context: Dict) -> bool:
    return context.get('revision_count', 0) >= 3

def _verified_transaction(context: Dict) -> bool:
    return context.get('payment_confirmed', False)

def _tech_available(context: Dict) -> bool:
    return context.get('tech_available', False)

def _within_timeout(context: Dict) -> bool:
    return context.get('within_timeout', True)

def _decline_count_under_limit(context: Dict) -> bool:
    return context.get('decline_count', 0) < 3

def _decline_count_at_limit(context: Dict) -> bool:
    return context.get('decline_count', 0) >= 3

def _evidence_uploaded(context: Dict) -> bool:
    return context.get('evidence_uploaded', False)

def _verification_not_required(context: Dict) -> bool:
    return not context.get('category_requires_verification', True)

def _qa_pass(context: Dict) -> bool:
    return context.get('qa_pass', False)

def _qa_fail(context: Dict) -> bool:
    return context.get('qa_fail', False)

def _audit_justification_provided(context: Dict) -> bool:
    return context.get('audit_justification_provided', False)

def _trigger_condition_met(context: Dict) -> bool:
    return context.get('trigger_condition_met', True)

def _manager_pre_approval_needed(context: Dict) -> bool:
    # This is a placeholder for a complex business rule
    return True

TRANSITIONS = [
    Transition(RequestState.DRAFT, RequestAction.SUBMIT, RequestState.SUBMITTED, "request.submit", _has_valid_schema),
    Transition(RequestState.SUBMITTED, RequestAction.PICK_UP, RequestState.STAFF_REVIEW, "request.triage", _staff_assigned),
    Transition(RequestState.STAFF_REVIEW, RequestAction.NEEDS_QUOTE, RequestState.AWAITING_QUOTE, "request.triage", _category_requires_quote),
    Transition(RequestState.STAFF_REVIEW, RequestAction.REQUIRE_PAYMENT, RequestState.AWAITING_PAYMENT, "request.triage", _category_skips_quote),
    Transition(RequestState.STAFF_REVIEW, RequestAction.ASSIGN_DIRECTLY, RequestState.AWAITING_ASSIGNMENT, "request.triage", _category_skips_quote_and_payment),
    Transition(RequestState.AWAITING_QUOTE, RequestAction.ISSUE_QUOTE, RequestState.AWAITING_CUSTOMER_APPROVAL, "quote.create", _has_valid_quote_version),
    Transition(RequestState.AWAITING_CUSTOMER_APPROVAL, RequestAction.APPROVE_QUOTE_PAYMENT_REQ, RequestState.AWAITING_PAYMENT, "quote.approve", _upfront_payment_required),
    Transition(RequestState.AWAITING_CUSTOMER_APPROVAL, RequestAction.APPROVE_QUOTE_NO_PAYMENT, RequestState.AWAITING_ASSIGNMENT, "quote.approve", _no_upfront_payment_required),
    Transition(RequestState.AWAITING_CUSTOMER_APPROVAL, RequestAction.REQUEST_REVISION, RequestState.AWAITING_QUOTE, "quote.revise", _revision_count_under_limit),
    Transition(RequestState.AWAITING_CUSTOMER_APPROVAL, RequestAction.REQUEST_REVISION, RequestState.ESCALATED, "quote.revise", _revision_count_at_limit),
    Transition(RequestState.AWAITING_CUSTOMER_APPROVAL, RequestAction.REJECT_QUOTE, RequestState.AWAITING_QUOTE, "quote.reject"),
    Transition(RequestState.AWAITING_PAYMENT, RequestAction.PAYMENT_WEBHOOK, RequestState.AWAITING_ASSIGNMENT, "system.webhook", _verified_transaction),
    Transition(RequestState.AWAITING_ASSIGNMENT, RequestAction.ASSIGN_TECH, RequestState.ASSIGNED, "request.assign", _tech_available),
    Transition(RequestState.ASSIGNED, RequestAction.ACCEPT, RequestState.IN_PROGRESS, "assignment.accept", _within_timeout),
    Transition(RequestState.ASSIGNED, RequestAction.DECLINE, RequestState.AWAITING_ASSIGNMENT, "assignment.decline", _decline_count_under_limit),
    Transition(RequestState.ASSIGNED, RequestAction.DECLINE, RequestState.ESCALATED, "assignment.decline", _decline_count_at_limit),
    Transition(RequestState.ASSIGNED, RequestAction.TIMEOUT, RequestState.ESCALATED, "system.timeout", _decline_count_at_limit),
    Transition(RequestState.IN_PROGRESS, RequestAction.MARK_FINISHED, RequestState.PENDING_VERIFICATION, "verification.submit", _evidence_uploaded),
    Transition(RequestState.IN_PROGRESS, RequestAction.MARK_FINISHED_NO_VERIFICATION, RequestState.COMPLETED, "verification.submit", _verification_not_required),
    Transition(RequestState.PENDING_VERIFICATION, RequestAction.APPROVE_VERIFICATION, RequestState.COMPLETED, "verification.verify", _qa_pass),
    Transition(RequestState.PENDING_VERIFICATION, RequestAction.REJECT_VERIFICATION, RequestState.IN_PROGRESS, "verification.verify", _qa_fail),
    Transition(RequestState.PENDING_VERIFICATION, RequestAction.OVERRIDE_VERIFICATION, RequestState.COMPLETED, "verification.override", _audit_justification_provided),
    Transition(RequestState.ESCALATED, RequestAction.RESOLVE_ESCALATION, RequestState.AWAITING_ASSIGNMENT, "escalation.resolve"),
    Transition(RequestState.ESCALATED, RequestAction.RESOLVE_ESCALATION, RequestState.ASSIGNED, "escalation.resolve"),
    Transition(RequestState.ESCALATED, RequestAction.RESOLVE_ESCALATION, RequestState.IN_PROGRESS, "escalation.resolve"),
    Transition(RequestState.ESCALATED, RequestAction.RESOLVE_ESCALATION, RequestState.CANCELLED, "escalation.resolve"),
]

# Cancellation Transitions
for state in RequestState:
    if state not in [RequestState.COMPLETED, RequestState.CANCELLED]:
        if state in [RequestState.ASSIGNED, RequestState.IN_PROGRESS, RequestState.PENDING_VERIFICATION]:
            TRANSITIONS.append(Transition(state, RequestAction.CANCEL_ACTIVE, RequestState.CANCELLED, "request.cancel_active", _manager_pre_approval_needed))
        else:
             TRANSITIONS.append(Transition(state, RequestAction.CANCEL, RequestState.CANCELLED, "request.cancel"))

# Escalation Transitions
for state in RequestState:
    if state not in [RequestState.COMPLETED, RequestState.CANCELLED, RequestState.ESCALATED]:
        TRANSITIONS.append(Transition(state, RequestAction.ESCALATE, RequestState.ESCALATED, "request.escalate", _trigger_condition_met))
