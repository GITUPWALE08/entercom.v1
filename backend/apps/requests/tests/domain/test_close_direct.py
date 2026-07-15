"""
Tests for CLOSE_DIRECT transition and _category_allows_direct_close guard.
Ref: docs/workflows/request-lifecycle.md §17
"""
import pytest
from apps.requests.domain.states import RequestState
from apps.requests.domain.actions import RequestAction
from apps.requests.domain.context import RequestContext
from apps.requests.domain.state_machine import RequestStateMachine
from apps.requests.domain.exceptions import GuardConditionFailedError, InvalidTransitionError


TRIAGE_PERMISSIONS = ["request.triage"]


def _ctx(category: str) -> RequestContext:
    ctx = RequestContext()
    ctx.category = category
    ctx.staff_assigned = True
    ctx.has_valid_schema = True
    return ctx


class TestCloseDirectTransition:

    def test_close_direct_information_succeeds(self):
        """information category can be closed directly from staff_review."""
        machine = RequestStateMachine(RequestState.STAFF_REVIEW)
        ctx = _ctx("information")
        new_state = machine.transition(RequestAction.CLOSE_DIRECT, TRIAGE_PERMISSIONS, ctx)
        assert new_state == RequestState.COMPLETED

    def test_close_direct_support_succeeds(self):
        """support category can be closed directly from staff_review."""
        machine = RequestStateMachine(RequestState.STAFF_REVIEW)
        ctx = _ctx("support")
        new_state = machine.transition(RequestAction.CLOSE_DIRECT, TRIAGE_PERMISSIONS, ctx)
        assert new_state == RequestState.COMPLETED

    def test_close_direct_installation_blocked(self):
        """installation category must NOT be closed directly — it requires a technician."""
        machine = RequestStateMachine(RequestState.STAFF_REVIEW)
        ctx = _ctx("installation")
        with pytest.raises((GuardConditionFailedError, InvalidTransitionError)):
            machine.transition(RequestAction.CLOSE_DIRECT, TRIAGE_PERMISSIONS, ctx)

    def test_close_direct_maintenance_blocked(self):
        """maintenance must NOT be directly closeable."""
        machine = RequestStateMachine(RequestState.STAFF_REVIEW)
        ctx = _ctx("maintenance")
        with pytest.raises((GuardConditionFailedError, InvalidTransitionError)):
            machine.transition(RequestAction.CLOSE_DIRECT, TRIAGE_PERMISSIONS, ctx)

    def test_close_direct_consultation_blocked(self):
        """consultation must NOT be directly closeable — requires payment."""
        machine = RequestStateMachine(RequestState.STAFF_REVIEW)
        ctx = _ctx("consultation")
        with pytest.raises((GuardConditionFailedError, InvalidTransitionError)):
            machine.transition(RequestAction.CLOSE_DIRECT, TRIAGE_PERMISSIONS, ctx)

    def test_close_direct_requires_triage_permission(self):
        """CLOSE_DIRECT must require request.triage permission."""
        from apps.requests.domain.exceptions import PermissionDeniedTransitionError
        machine = RequestStateMachine(RequestState.STAFF_REVIEW)
        ctx = _ctx("information")
        with pytest.raises(PermissionDeniedTransitionError):
            machine.transition(RequestAction.CLOSE_DIRECT, ["request.update"], ctx)

    def test_close_direct_not_allowed_from_non_staff_review(self):
        """CLOSE_DIRECT must only be valid from staff_review state."""
        for state in [RequestState.SUBMITTED, RequestState.AWAITING_QUOTE, RequestState.IN_PROGRESS]:
            machine = RequestStateMachine(state)
            ctx = _ctx("information")
            with pytest.raises((InvalidTransitionError, GuardConditionFailedError)):
                machine.transition(RequestAction.CLOSE_DIRECT, TRIAGE_PERMISSIONS, ctx)


class TestTriagePermissions:
    """Ensure all triage actions require request.triage permission."""

    @pytest.mark.parametrize("action", [
        RequestAction.NEEDS_QUOTE,
        RequestAction.REQUIRE_PAYMENT,
        RequestAction.ASSIGN_DIRECTLY,
        RequestAction.CLOSE_DIRECT,
    ])
    def test_triage_action_requires_triage_permission(self, action):
        from apps.requests.domain.exceptions import PermissionDeniedTransitionError
        machine = RequestStateMachine(RequestState.STAFF_REVIEW)
        ctx = _ctx("information")
        ctx.category_requires_quote = False
        ctx.category_requires_payment = False
        with pytest.raises(PermissionDeniedTransitionError):
            machine.transition(action, ["request.update"], ctx)  # wrong permission
