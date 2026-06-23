import pytest
from apps.requests.domain.states import RequestState
from apps.requests.domain.actions import RequestAction
from apps.requests.domain.exceptions import (
    InvalidTransitionError,
    PermissionDeniedTransitionError,
    GuardConditionFailedError
)
from apps.requests.domain.state_machine import RequestStateMachine

class TestRequestStateMachine:
    
    def test_valid_happy_path_transition(self):
        """Verifies a standard transition from draft to submitted."""
        machine = RequestStateMachine(RequestState.DRAFT)
        context = {'has_valid_schema': True}
        permissions = ["request.submit"]
        
        new_state = machine.transition(RequestAction.SUBMIT, permissions, context)
        
        assert new_state == RequestState.SUBMITTED
        assert machine.current_state == RequestState.SUBMITTED

    def test_invalid_transition_raises_error(self):
        """Verifies that jumping states illegally raises an exception."""
        machine = RequestStateMachine(RequestState.DRAFT)
        
        with pytest.raises(InvalidTransitionError) as exc:
            # Cannot assign a draft directly
            machine.transition(RequestAction.ASSIGN_TECH, ["request.assign"], {'tech_available': True})
            
        assert "is not allowed from state" in str(exc.value)

    def test_permission_denied_raises_error(self):
        """Verifies RBAC enforcement within the domain state machine."""
        machine = RequestStateMachine(RequestState.SUBMITTED)
        context = {'staff_assigned': True}
        
        # Action is PICK_UP, which requires 'request.triage'. We pass an invalid permission.
        with pytest.raises(PermissionDeniedTransitionError) as exc:
            machine.transition(RequestAction.PICK_UP, ["request.create"], context)
            
        assert "Missing required permission" in str(exc.value)

    def test_guard_condition_blocks_transition(self):
        """Verifies that failing a domain guard (e.g., tech not available) halts transition."""
        machine = RequestStateMachine(RequestState.AWAITING_ASSIGNMENT)
        permissions = ["request.assign"]
        context = {'tech_available': False} # Guard condition fails
        
        with pytest.raises(GuardConditionFailedError) as exc:
            machine.transition(RequestAction.ASSIGN_TECH, permissions, context)
            
        assert "Guard condition failed" in str(exc.value)

    def test_payment_gate_enforcement(self):
        """Verifies Payment Gate enforcement for categories requiring upfront payment."""
        machine = RequestStateMachine(RequestState.AWAITING_CUSTOMER_APPROVAL)
        permissions = ["quote.approve"]
        
        # Test branching based on guard logic: Payment Required
        context_payment_req = {'upfront_payment_required': True}
        machine.transition(RequestAction.APPROVE_QUOTE_PAYMENT_REQ, permissions, context_payment_req)
        assert machine.current_state == RequestState.AWAITING_PAYMENT

    def test_no_payment_gate_bypass(self):
        """Verifies Quote Approval bypasses payment state if not required."""
        machine = RequestStateMachine(RequestState.AWAITING_CUSTOMER_APPROVAL)
        permissions = ["quote.approve"]
        
        context_no_payment = {'upfront_payment_required': False}
        machine.transition(RequestAction.APPROVE_QUOTE_NO_PAYMENT, permissions, context_no_payment)
        assert machine.current_state == RequestState.AWAITING_ASSIGNMENT

    def test_verification_rework_loop(self):
        """Verifies the QA Rework loop moves from pending_verification to in_progress."""
        machine = RequestStateMachine(RequestState.PENDING_VERIFICATION)
        permissions = ["verification.verify"]
        context = {'qa_fail': True}
        
        machine.transition(RequestAction.REJECT_VERIFICATION, permissions, context)
        assert machine.current_state == RequestState.IN_PROGRESS

    def test_escalation_multiple_targets(self):
        """Verifies resolution of escalation allows routing to explicitly chosen targets."""
        machine = RequestStateMachine(RequestState.ESCALATED)
        permissions = ["escalation.resolve"]
        
        # Resolve back to awaiting_assignment
        machine.transition(RequestAction.RESOLVE_ESCALATION, permissions, target_state=RequestState.AWAITING_ASSIGNMENT)
        assert machine.current_state == RequestState.AWAITING_ASSIGNMENT
        
    def test_terminal_state_cancellation(self):
        """Verifies cancellation transition across active states."""
        machine = RequestStateMachine(RequestState.AWAITING_QUOTE)
        permissions = ["request.cancel"]
        
        machine.transition(RequestAction.CANCEL, permissions)
        assert machine.current_state == RequestState.CANCELLED
        
        # Once cancelled, no further transitions should be allowed
        with pytest.raises(InvalidTransitionError):
            machine.transition(RequestAction.ESCALATE, ["request.escalate"], {'trigger_condition_met': True})
