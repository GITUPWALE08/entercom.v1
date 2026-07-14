from typing import List, Optional
from .states import RequestState
from .actions import RequestAction
from .context import RequestContext
from .transitions import TRANSITIONS, Transition, TriggerType
from .exceptions import (
    InvalidTransitionError,
    PermissionDeniedTransitionError,
    GuardConditionFailedError
)

class RequestStateMachine:
    def __init__(self, current_state):
        if current_state is None:
            raise ValueError("State cannot be None")
        if hasattr(current_state, "value"):
            current_state = current_state.value
        try:
            self.current_state = RequestState(current_state)
        except ValueError:
            raise ValueError(f"Invalid state: {current_state}")

    def _get_transitions_for_state(self, state: RequestState) -> List[Transition]:
        return [t for t in TRANSITIONS if t.source == state]
    
    def get_allowed_transitions(self) -> List[Transition]:
        return self._get_transitions_for_state(self.current_state)

    def get_allowed_automatic_transitions(self, context: RequestContext) -> List[Transition]:
        """
        Discovers all valid automatic or system transitions from the current state.
        This allows the Orchestrator to dynamically progress the state machine
        without hardcoded knowledge of actions.
        """
        valid_transitions = []
        for t in self.get_allowed_transitions():
            if t.trigger_type in [TriggerType.AUTOMATIC, TriggerType.SYSTEM, TriggerType.SCHEDULED]:
                if t.guard is None or t.guard(context):
                    valid_transitions.append(t)
        return valid_transitions

    def transition(self, action: RequestAction, user_permissions: List[str], context: RequestContext, target_state: Optional[RequestState] = None) -> RequestState:
        """
        Executes a state transition based on the provided action.
        
        Args:
            action: The action triggering the transition.
            user_permissions: A list of permission strings the actor holds.
            context: A strongly typed RequestContext object containing data needed for guard conditions.
            target_state: (Optional) The specific target state if the action has multiple possible targets (e.g., resolve_escalation).
            
        Returns:
            The resulting target state if the transition is successful.
            
        Raises:
            InvalidTransitionError: If the action is not valid for the current state.
            PermissionDeniedTransitionError: If the actor lacks the required permission.
            GuardConditionFailedError: If a guard condition fails.
        """
        if not isinstance(context, RequestContext):
            # Fallback for legacy compatibility during refactor, convert to dict if possible
            if isinstance(context, dict):
                context = RequestContext(**context)
            else:
                context = RequestContext()

        allowed_transitions = [t for t in self.get_allowed_transitions() if t.action == action]

        if not allowed_transitions:
            raise InvalidTransitionError(f"Action '{action}' is not allowed from state '{self.current_state}'.")

        # Find the specific transition if target_state is provided
        if target_state:
             matching_transitions = [t for t in allowed_transitions if t.target == target_state]
             if not matching_transitions:
                 raise InvalidTransitionError(f"Action '{action}' cannot transition to '{target_state}' from '{self.current_state}'.")
             transition_to_evaluate = matching_transitions[0]
        else:
             if len(allowed_transitions) > 1:
                # If there are multiple target states for this action, we must evaluate guards to find the right one
                valid_transitions = []
                for t in allowed_transitions:
                     if t.guard is None or t.guard(context):
                         valid_transitions.append(t)
                
                if not valid_transitions:
                     raise GuardConditionFailedError(f"No valid transition found for action '{action}' due to failing guard conditions.")
                if len(valid_transitions) > 1:
                     raise InvalidTransitionError(f"Ambiguous transition for action '{action}'. Multiple guards evaluated to true.")
                transition_to_evaluate = valid_transitions[0]
             else:
                transition_to_evaluate = allowed_transitions[0]

        # 1. Validate Permission
        if transition_to_evaluate.required_permission not in user_permissions:
            raise PermissionDeniedTransitionError(f"Missing required permission: '{transition_to_evaluate.required_permission}'.")

        # 2. Validate Guard
        if transition_to_evaluate.guard and not transition_to_evaluate.guard(context):
            raise GuardConditionFailedError(f"Guard condition failed for transition to '{transition_to_evaluate.target}'.")

        # 3. Return Target State
        self.current_state = transition_to_evaluate.target
        return self.current_state
