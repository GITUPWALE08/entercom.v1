from typing import Dict, List, Optional
from .states import RequestState
from .actions import RequestAction
from .transitions import TRANSITIONS, Transition
from .exceptions import (
    InvalidTransitionError,
    PermissionDeniedTransitionError,
    GuardConditionFailedError
)

class RequestStateMachine:
    def __init__(self, current_state: RequestState):
        self.current_state = current_state

    def _get_transitions_for_state(self, state: RequestState) -> List[Transition]:
        return [t for t in TRANSITIONS if t.source == state]
    
    def get_allowed_transitions(self) -> List[Transition]:
        return self._get_transitions_for_state(self.current_state)

    def transition(self, action: RequestAction, user_permissions: List[str], context: Dict = None, target_state: Optional[RequestState] = None) -> RequestState:
        """
        Executes a state transition based on the provided action.
        
        Args:
            action: The action triggering the transition.
            user_permissions: A list of permission strings the actor holds.
            context: A dictionary containing data needed for guard conditions.
            target_state: (Optional) The specific target state if the action has multiple possible targets (e.g., resolve_escalation).
            
        Returns:
            The resulting target state if the transition is successful.
            
        Raises:
            InvalidTransitionError: If the action is not valid for the current state.
            PermissionDeniedTransitionError: If the actor lacks the required permission.
            GuardConditionFailedError: If a guard condition fails.
        """
        if context is None:
            context = {}

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
