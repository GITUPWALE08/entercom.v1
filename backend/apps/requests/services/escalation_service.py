from apps.requests.permissions.matrix import PermissionRegistry
from apps.requests.permissions.constants import Role
"""
EscalationService: Handles exceptions and bottlenecks that require managerial intervention.
Ref: docs/architecture/request/request-services.md (Section 5.5)
"""
import logging
import uuid
from typing import Any, Optional

from django.contrib.auth import get_user_model
from django.db import transaction
from django.utils import timezone

from apps.audit_logs.services.audit_service import log_action
from apps.requests.domain.actions import RequestAction
from apps.requests.domain.state_machine import RequestStateMachine
from apps.requests.events.publishers import DomainEventPublisher
from apps.requests.models import (
    Escalation,
    EscalationReasonCode,
    EscalationStatus,
    LifecycleState,
    StateHistory,
    Request,
)
from apps.notification.services import DispatchOrchestrator

User = get_user_model()
logger = logging.getLogger(__name__)


class EscalationService:
    """
    Service for routing requests to management and resolving bottlenecks.
    """

    @staticmethod
    @transaction.atomic
    def process_escalation(
        request_id: Any, trigger_type: str, actor: Optional[User] = None
    ) -> Escalation:
        """
        Routes a request to the escalated state and creates an escalation record.
        Ref: docs/implementation/request/request-service-design.md (4.7)
        """
        request = Request.objects.select_for_update().get(pk=request_id)
        
        # Invariant: At most one ACTIVE/PENDING escalation may exist for a request.
        existing_escalation = Escalation.objects.filter(request=request, status=EscalationStatus.PENDING).first()
        if existing_escalation:
            return existing_escalation

        prev_status = request.status

        correlation_id = str(uuid.uuid4())
        if request.status != LifecycleState.ESCALATED:
            machine = RequestStateMachine(LifecycleState(request.status))
            user_permissions = [p.value for p in PermissionRegistry.get_permissions_for_role(Role(actor.role))] if hasattr(actor, "role") else [] if actor else ["system.escalate"]
            
            new_status = machine.transition(
                action=RequestAction.ESCALATE,
                user_permissions=user_permissions if actor else ["request.escalate"],
                context={"trigger_condition_met": True},
            )
            request.status = new_status
            request.priority = "emergency"
            request.save()

            StateHistory.objects.create(
                request=request,
                from_state=prev_status,
                to_state=new_status,
                actor=actor,
                reason=trigger_type,
                correlation_id=correlation_id,
            )
        else:
             new_status = request.status

        reason_map = {
            "SLA_BREACH": EscalationReasonCode.SLA_BREACH,
            "THREE_DECLINES": EscalationReasonCode.THREE_DECLINES_THRESHOLD,
            "MANUAL": EscalationReasonCode.MANUAL_MANAGER_REVIEW,
            "REPEATED_VERIFICATION_FAILURE": EscalationReasonCode.REPEATED_VERIFICATION_FAILURE,
        }
        reason_code = reason_map.get(trigger_type, EscalationReasonCode.MANUAL_MANAGER_REVIEW)

        escalation = Escalation.objects.create(
            request=request,
            reason=reason_code,
            status=EscalationStatus.PENDING,
            triggered_by=actor,
        )

        log_action(
            action="escalation.triggered", 
            actor=actor, 
            resource_id=str(request.id), 
            reason=trigger_type,
            metadata={
                "previous_state": prev_status,
                "new_state": new_status,
            }
        )
        transaction.on_commit(lambda: DomainEventPublisher.publish_escalation_triggered(
            request_id=request.id,
            correlation_id=correlation_id,
            actor_id=actor.id if actor else 0,
            trigger_type=trigger_type,
        ))

        # [DEFERRED] Non-MVP event
        # transaction.on_commit(lambda: DispatchOrchestrator.dispatch_event(
        #     event_type="request_escalated",
        #     recipient_id=request.customer_id,
        #     resource_type="request",
        #     resource_id=str(request.id),
        #     category="alerts",
        #     title="Request Escalated",
        #     message="Your request has been escalated for priority review.",
        #     context={"trigger": trigger_type},
        #     is_system_critical=True,
        # ))
        
        # [DEFERRED] Non-MVP event
        # transaction.on_commit(lambda: DispatchOrchestrator.dispatch_event(
        #     event_type="manager_escalated" if trigger_type == "MANUAL" else "emergency_queue_entered",
        #     recipient_id=0,
        #     resource_type="escalation",
        #     resource_id=str(escalation.id),
        #     category="alerts",
        #     title="Escalation Required",
        #     message=f"Request {request.public_id} requires management attention.",
        #     context={"trigger": trigger_type},
        #     is_system_critical=True,
        # ))

        return escalation

    @staticmethod
    @transaction.atomic
    def resolve(
        request_id: Any, actor: User, target_state: str, resolution_type: str
    ) -> Request:
        """
        Manager resolves an escalation and re-routes the request.
        Ref: docs/workflows/escalation-flow.md
        """
        from apps.requests.permissions.constants import Permission, Role
        from apps.requests.permissions.checks import RBACChecker
        from django.core.exceptions import PermissionDenied

        request = Request.objects.select_for_update().get(pk=request_id)

        # RBAC Validation
        if not RBACChecker.check_scoped_permission(
            role=Role(actor.role), 
            permission=Permission.ESCALATION_RESOLVE, 
            user_id=actor.id,
            resource=request
        ):
            raise PermissionDenied("Missing escalation.resolve permission.")

        escalation = Escalation.objects.filter(
            request=request, status=EscalationStatus.PENDING
        ).latest("created_at")

        prev_status = request.status
        machine = RequestStateMachine(LifecycleState(request.status))
        user_permissions = [p.value for p in PermissionRegistry.get_permissions_for_role(Role(actor.role))] if hasattr(actor, "role") else []
        
        new_status = machine.transition(
            action=RequestAction.RESOLVE_ESCALATION,
            user_permissions=user_permissions,
            target_state=LifecycleState(target_state),
        )

        request.status = new_status
        request.save()

        escalation.status = EscalationStatus.RESOLVED
        escalation.resolved_by = actor
        escalation.resolved_at = timezone.now()
        escalation.save()

        correlation_id = str(uuid.uuid4())
        StateHistory.objects.create(
            request=request,
            from_state=prev_status,
            to_state=new_status,
            actor=actor,
            reason=resolution_type,
            correlation_id=correlation_id,
        )

        # CORRECTION: Added mandatory state fields
        log_action(
            action="escalation.resolved", 
            actor=actor, 
            resource_id=str(request.id), 
            reason=resolution_type,
            metadata={
                "previous_state": prev_status,
                "new_state": new_status,
            }
        )
        transaction.on_commit(lambda: DomainEventPublisher.publish_escalation_resolved(
            request_id=request.id,
            correlation_id=correlation_id,
            actor_id=actor.id,
            resolution_type=resolution_type,
        ))

        return request
