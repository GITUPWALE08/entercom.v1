from apps.requests.permissions.matrix import PermissionRegistry
from apps.requests.permissions.constants import Role
"""
RequestService: Orchestrates the core lifecycle transitions and canonical state management.
Ref: docs/architecture/request/request-services.md (Section 5.1)
"""
import logging
import uuid
from typing import Any, Dict, List, Optional

from django.contrib.auth import get_user_model
from django.db import transaction

from apps.audit_logs.services.audit_service import log_action
from apps.requests.domain.actions import RequestAction
from apps.requests.domain.state_machine import RequestStateMachine
from apps.requests.events.publishers import DomainEventPublisher
from apps.requests.models import LifecycleState, Request, StateHistory

User = get_user_model()
logger = logging.getLogger(__name__)


class RequestService:
    """
    Service for managing Request lifecycle, creation, and state transitions.
    """

    @staticmethod
    def list_requests(user: User) -> Any:
        """
        Lists requests based on user role and ownership.
        Ref: docs/architecture/request/request-domain.md (Section 6.2 Ownership Matrix)
        """
        if not hasattr(user, "role"):
            return Request.objects.filter(customer=user)
            
        if user.role in ["staff", "manager", "superadmin"]:
            return Request.objects.all()
        elif user.role == "technician":
            from django.db.models import Q
            return Request.objects.filter(Q(assigned_technician=user) | Q(assignments__technician=user)).distinct()
        else:
            return Request.objects.filter(customer=user)

    @staticmethod
    def get_request_by_id(request_id: Any) -> Request:
        """
        Retrieves a single request, abstracting ORM access.
        """
        try:
            return Request.objects.get(pk=request_id)
        except Request.DoesNotExist:
            from django.http import Http404
            raise Http404("Request not found")

    @staticmethod
    @transaction.atomic
    def create_request(user: User, data: Dict[str, Any]) -> Request:
        """
        Creates a new Request in DRAFT state.
        Ref: docs/architecture/request/request-services.md (5.1)
        """
        from apps.requests.permissions.constants import Permission, Role
        from apps.requests.permissions.checks import RBACChecker
        from django.core.exceptions import PermissionDenied

        # 1. RBAC Validation
        if not RBACChecker.check_scoped_permission(
            role=Role(user.role), 
            permission=Permission.REQUEST_CREATE, 
            user_id=user.id
        ):
            raise PermissionDenied("Missing request.create permission.")

        public_id = f"REQ-{uuid.uuid4().hex[:8].upper()}"

        request = Request.objects.create(
            public_id=public_id,
            customer=user,
            category=data["category"],
            priority=data.get("priority", "normal"),
            status=LifecycleState.DRAFT,
            description=data["description"],
            location=data.get("location"),
        )

        # Audit Integration
        log_action(
            action="request.created",
            actor=user,
            resource_type="request",
            resource_id=str(request.id),
            metadata={"category": request.category},
        )

        # Domain Event Integration
        correlation_id = str(uuid.uuid4())
        transaction.on_commit(lambda: DomainEventPublisher.publish_request_created(
            request_id=request.id,
            correlation_id=correlation_id,
            actor_id=user.id,
            customer_id=user.id,
            category=request.category,
        ))

        return request

    @staticmethod
    def get_timeline(request_id: Any, user: User) -> List[Dict[str, Any]]:
        """
        Retrieves the chronologically ordered state history for a request.
        """
        history = StateHistory.objects.filter(request_id=request_id).order_by('timestamp')
        return [{"from_state": h.from_state, "to_state": h.to_state, "reason": h.reason, "created_at": h.timestamp} for h in history]

    @staticmethod
    @transaction.atomic
    def update_request(request_id: Any, user: User, data: Dict[str, Any]) -> Request:
        """
        Updates basic request fields (description, location).
        Does NOT support status, technician, or customer mutation.
        """
        from apps.requests.permissions.constants import Permission, Role
        from apps.requests.permissions.checks import RBACChecker
        from django.core.exceptions import PermissionDenied
        from apps.requests.domain.exceptions import InvalidTransitionError

        request = Request.objects.select_for_update().get(pk=request_id)
        
        # Terminal state immutability
        if request.status in [LifecycleState.COMPLETED, LifecycleState.CANCELLED]:
            raise InvalidTransitionError("Cannot update a request in a terminal state.")

        # RBAC Validation
        if not RBACChecker.check_scoped_permission(
            role=Role(user.role), 
            permission=Permission.REQUEST_UPDATE, 
            user_id=user.id,
            resource=request
        ):
            raise PermissionDenied("Missing request.update permission.")
            
        allowed_fields = {"description", "location"}
        updates_made = {}
        for field in allowed_fields:
            if field in data:
                setattr(request, field, data[field])
                updates_made[field] = data[field]
                
        if updates_made:
            request.save()
            log_action(
                action="request.updated",
                actor=user,
                resource_type="request",
                resource_id=str(request.id),
                metadata={"fields": list(updates_made.keys())}
            )
            # Emit Domain event.
            correlation_id = str(uuid.uuid4())
            transaction.on_commit(lambda: DomainEventPublisher.publish_request_updated(
                request_id=request.id,
                correlation_id=correlation_id,
                actor_id=user.id,
                updates=updates_made
            ))
            
        return request

    @staticmethod
    @transaction.atomic
    def submit(request_id: Any, actor: User) -> Request:
        """
        Transitions a request from DRAFT to SUBMITTED.
        Ref: docs/architecture/request/request-services.md (5.1)
        """
        from apps.requests.permissions.constants import Permission, Role
        from apps.requests.permissions.checks import RBACChecker
        from django.core.exceptions import PermissionDenied

        request = Request.objects.select_for_update().get(pk=request_id)
        
        # RBAC Validation
        if not RBACChecker.check_scoped_permission(
            role=Role(actor.role), 
            permission=Permission.REQUEST_SUBMIT, 
            user_id=actor.id,
            resource=request
        ):
            raise PermissionDenied("Missing request.submit permission.")

        prev_status = request.status

        # 1. State Machine Validation
        machine = RequestStateMachine(LifecycleState(request.status))
        # Context guards (e.g., has_valid_schema) are validated here
        new_status = machine.transition(
            action=RequestAction.SUBMIT,
            user_permissions=[p.value for p in PermissionRegistry.get_permissions_for_role(Role(actor.role))] if hasattr(actor, "role") else [],
            context={"has_valid_schema": True},
        )

        # 2. Persist State Change
        request.status = new_status
        request.save()

        # 3. State History (Immutable Ledger)
        correlation_id = str(uuid.uuid4())
        StateHistory.objects.create(
            request=request,
            from_state=prev_status,
            to_state=new_status,
            actor=actor,
            correlation_id=correlation_id,
        )

        # 4. Audit Log (Forensic)
        log_action(
            action="request.submitted",
            actor=actor,
            resource_type="request",
            resource_id=str(request.id),
            reason="User submitted draft",
            metadata={
                "previous_state": prev_status,
                "new_state": new_status,
            },
        )

        # 5. Domain Event
        transaction.on_commit(lambda: DomainEventPublisher.publish_request_submitted(
            request_id=request.id,
            correlation_id=correlation_id,
            actor_id=actor.id,
            priority=request.priority,
            category=request.category,
        ))

        return request

    @staticmethod
    @transaction.atomic
    def cancel(request_id: Any, actor: User, reason_code: str) -> Request:
        """
        Terminal cancellation of a request.
        Ref: docs/workflows/cancellation-policy.md
        """
        from apps.requests.permissions.constants import Permission, Role
        from apps.requests.permissions.checks import RBACChecker
        from django.core.exceptions import PermissionDenied

        request = Request.objects.select_for_update().get(pk=request_id)
        
        # RBAC Validation
        if not RBACChecker.check_scoped_permission(
            role=Role(actor.role), 
            permission=Permission.REQUEST_CANCEL, 
            user_id=actor.id,
            resource=request
        ):
            raise PermissionDenied("Missing request.cancel permission.")

        prev_status = request.status

        # Determine if it's a standard cancel or cancel_active (requires manager)
        is_active = request.status in [
            LifecycleState.ASSIGNED,
            LifecycleState.IN_PROGRESS,
            LifecycleState.PENDING_VERIFICATION,
        ]
        action = RequestAction.CANCEL_ACTIVE if is_active else RequestAction.CANCEL

        # 1. State Machine Validation
        machine = RequestStateMachine(LifecycleState(request.status))
        new_status = machine.transition(
            action=action,
            user_permissions=[p.value for p in PermissionRegistry.get_permissions_for_role(Role(actor.role))] if hasattr(actor, "role") else [],
            context={"trigger_condition_met": True},
        )

        # 2. Persist State Change
        request.status = new_status
        request.save()

        # 3. Side Effects
        correlation_id = str(uuid.uuid4())
        StateHistory.objects.create(
            request=request,
            from_state=prev_status,
            to_state=new_status,
            actor=actor,
            reason=reason_code,
            correlation_id=correlation_id,
        )

        # 4. Audit Log
        log_action(
            action="request.cancelled",
            actor=actor,
            resource_type="request",
            resource_id=str(request.id),
            reason=reason_code,
            metadata={
                "previous_state": prev_status,
                "new_state": new_status,
            },
        )

        # 5. Domain Event
        transaction.on_commit(lambda: DomainEventPublisher.publish_request_cancelled(
            request_id=request.id,
            correlation_id=correlation_id,
            actor_id=actor.id,
            reason_code=reason_code,
        ))

        return request
