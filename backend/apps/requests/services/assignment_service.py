from apps.requests.permissions.matrix import PermissionRegistry
from apps.requests.permissions.constants import Role
"""
AssignmentService: Manages the matching and binding of technicians to requests.
Ref: docs/architecture/request/request-services.md (Section 5.2)
"""
import logging
import uuid
from datetime import timedelta
from typing import Any, List

from django.contrib.auth import get_user_model
from django.db import transaction
from django.utils import timezone

from apps.audit_logs.services.audit_service import log_action
from apps.requests.domain.actions import RequestAction
from apps.requests.domain.state_machine import RequestStateMachine
from apps.requests.events.publishers import DomainEventPublisher
from apps.requests.models import Assignment, LifecycleState, Request, StateHistory
from apps.notification.services import DispatchOrchestrator

User = get_user_model()
logger = logging.getLogger(__name__)


class AssignmentService:
    """
    Service for managing technician assignments and commit workflows.
    """

    @staticmethod
    @transaction.atomic
    def assign(request_id: Any, actor: User, technician_id: Any) -> Request:
        """
        Assigns a technician to a request.
        Ref: docs/architecture/request/request-services.md (5.2)
        """
        from apps.requests.permissions.constants import Permission, Role
        from apps.requests.permissions.checks import RBACChecker
        from django.core.exceptions import PermissionDenied

        request = Request.objects.select_for_update().get(pk=request_id)

        # RBAC Validation
        if not RBACChecker.check_scoped_permission(
            role=Role(actor.role), 
            permission=Permission.REQUEST_ASSIGN, 
            user_id=actor.id,
            resource=request
        ):
            raise PermissionDenied("Missing request.assign permission.")

        technician = User.objects.get(pk=technician_id)
        prev_status = request.status

        machine = RequestStateMachine(LifecycleState(request.status))
        user_permissions = [p.value for p in PermissionRegistry.get_permissions_for_role(Role(actor.role))] if hasattr(actor, "role") else []
        
        new_status = machine.transition(
            action=RequestAction.ASSIGN_TECH,
            user_permissions=user_permissions,
            context={"tech_available": True},
        )

        request.status = new_status
        request.assigned_technician = technician
        request.save()

        Assignment.objects.create(
            request=request, technician=technician, assigned_at=timezone.now()
        )

        correlation_id = str(uuid.uuid4())
        StateHistory.objects.create(
            request=request,
            from_state=prev_status,
            to_state=new_status,
            actor=actor,
            correlation_id=correlation_id,
        )

        log_action(
            action="request.assigned",
            actor=actor,
            resource_type="request",
            resource_id=str(request.id),
            metadata={
                "technician_id": str(technician.id),
                "previous_state": prev_status,
                "new_state": new_status,
            },
        )

        transaction.on_commit(lambda: DomainEventPublisher.publish_request_assigned(
            request_id=request.id,
            correlation_id=correlation_id,
            actor_id=actor.id,
            technician_id=technician.id,
        ))

        transaction.on_commit(lambda: DispatchOrchestrator.dispatch_event(
            event_type="technician_assigned",
            recipient_id=technician_id,
            context={"first_name": technician.first_name if technician else "Technician"},
            resource_type="request",
            resource_id=str(request.id),
            category="alerts",
            title="New Assignment",
            message=f"You have been assigned to a new request.",
            is_system_critical=True,
        ))

        transaction.on_commit(lambda: DispatchOrchestrator.dispatch_event(
            event_type="technician_assigned",
            recipient_id=request.customer.id,
            resource_type="request",
            resource_id=str(request.id),
            category="updates",
            title="Technician Assigned",
            message=f"A technician has been assigned to your request {request.public_id}.",
            context={},
            is_system_critical=False,
        ))

        return request

    @staticmethod
    @transaction.atomic
    def accept(request_id: Any, actor: User) -> Request:
        """
        Technician accepts an assignment.
        Ref: docs/workflows/technician-flow.md
        """
        from apps.requests.permissions.constants import Permission, Role
        from apps.requests.permissions.checks import RBACChecker
        from django.core.exceptions import PermissionDenied

        request = Request.objects.select_for_update().get(pk=request_id)
        
        # RBAC Validation
        if not RBACChecker.check_scoped_permission(
            role=Role(actor.role), 
            permission=Permission.ASSIGNMENT_ACCEPT, 
            user_id=actor.id,
            resource=request
        ):
            raise PermissionDenied("Missing assignment.accept permission.")

        prev_status = request.status

        machine = RequestStateMachine(LifecycleState(request.status))
        user_permissions = [p.value for p in PermissionRegistry.get_permissions_for_role(Role(actor.role))] if hasattr(actor, "role") else []
        
        new_status = machine.transition(
            action=RequestAction.ACCEPT,
            user_permissions=user_permissions,
            context={"within_timeout": True},
        )

        request.status = new_status
        request.save()

        assignment = Assignment.objects.filter(
            request=request, technician=actor
        ).latest("assigned_at")
        assignment.accepted_at = timezone.now()
        assignment.save()

        correlation_id = str(uuid.uuid4())
        StateHistory.objects.create(
            request=request,
            from_state=prev_status,
            to_state=new_status,
            actor=actor,
            correlation_id=correlation_id,
        )

        log_action(
            action="assignment.accepted",
            actor=actor,
            resource_type="request",
            resource_id=str(request.id),
            metadata={
                "previous_state": prev_status,
                "new_state": new_status,
            }
        )

        transaction.on_commit(lambda: DomainEventPublisher.publish_assignment_accepted(
            request_id=request.id,
            correlation_id=correlation_id,
            actor_id=actor.id,
            technician_id=actor.id,
            timestamp=timezone.now().isoformat(),
        ))

        # [DEFERRED] Non-MVP event
        # transaction.on_commit(lambda: DispatchOrchestrator.dispatch_event(
        #     event_type="assignment_accepted",
        #     recipient_id=request.customer.id,
        #     resource_type="assignment",
        #     resource_id=str(request.id),
        #     category="updates",
        #     title="Assignment Accepted",
        #     message="Your technician has accepted the assignment.",
        #     context={},
        #     is_system_critical=False,
        # ))

        return request

    @staticmethod
    @transaction.atomic
    def decline(request_id: Any, actor: User, reason_code: str) -> Request:
        """
        Technician declines an assignment. Increments decline count.
        Ref: docs/workflows/technician-flow.md
        """
        from apps.requests.permissions.constants import Permission, Role
        from apps.requests.permissions.checks import RBACChecker
        from django.core.exceptions import PermissionDenied

        request = Request.objects.select_for_update().get(pk=request_id)
        
        # RBAC Validation
        if not RBACChecker.check_scoped_permission(
            role=Role(actor.role), 
            permission=Permission.ASSIGNMENT_DECLINE, 
            user_id=actor.id,
            resource=request
        ):
            raise PermissionDenied("Missing assignment.decline permission.")

        prev_status = request.status
        new_decline_count = request.decline_count + 1

        machine = RequestStateMachine(LifecycleState(request.status))
        user_permissions = [p.value for p in PermissionRegistry.get_permissions_for_role(Role(actor.role))] if hasattr(actor, "role") else []
        
        new_status = machine.transition(
            action=RequestAction.DECLINE,
            user_permissions=user_permissions,
            context={"decline_count": new_decline_count},
        )

        request.status = new_status
        request.decline_count = new_decline_count
        request.assigned_technician = None
        request.save()

        assignment = Assignment.objects.filter(
            request=request, technician=actor
        ).latest("assigned_at")
        assignment.declined_at = timezone.now()
        assignment.decline_reason = reason_code
        assignment.save()

        correlation_id = str(uuid.uuid4())
        StateHistory.objects.create(
            request=request,
            from_state=prev_status,
            to_state=new_status,
            actor=actor,
            reason=reason_code,
            correlation_id=correlation_id,
        )

        log_action(
            action="assignment.declined",
            actor=actor,
            resource_type="request",
            resource_id=str(request.id),
            reason=reason_code,
            metadata={
                "decline_count": new_decline_count,
                "previous_state": prev_status,
                "new_state": new_status,
            },
        )

        transaction.on_commit(lambda: DomainEventPublisher.publish_assignment_declined(
            request_id=request.id,
            correlation_id=correlation_id,
            actor_id=actor.id,
            reason_code=reason_code,
        ))

        # We notify staff that an assignment was declined. (Recipient=actor.id isn't right, maybe just let orchestration handle it? Prompt says: assignment_declined)
        # [DEFERRED] Non-MVP event
        # transaction.on_commit(lambda: DispatchOrchestrator.dispatch_event(
        #     event_type="assignment_declined",
        #     recipient_id=request.customer.id,  # Or staff, but customer is standard
        #     resource_type="assignment",
        #     resource_id=str(request.id),
        #     category="alerts",
        #     title="Assignment Declined",
        #     message="The assigned technician declined the assignment.",
        #     context={"reason_code": reason_code},
        #     is_system_critical=False,
        # ))

        return request

    @staticmethod
    @transaction.atomic
    def handle_timeout() -> List[str]:
        """
        Sweeps for unaccepted assignments older than 48 hours.
        Ref: docs/implementation/request/request-service-design.md (4.7)
        """
        timeout_threshold = timezone.now() - timedelta(hours=48)
        timed_out_assignments = Assignment.objects.filter(
            accepted_at__isnull=True,
            declined_at__isnull=True,
            assigned_at__lt=timeout_threshold,
            request__status=LifecycleState.ASSIGNED,
        )

        processed_ids = []
        for assignment in timed_out_assignments:
            try:
                with transaction.atomic():
                    req = Request.objects.select_for_update().get(pk=assignment.request_id)
                    machine = RequestStateMachine(LifecycleState(req.status))
                    new_status = machine.transition(
                        action=RequestAction.TIMEOUT,
                        user_permissions=["system.timeout"],
                        context={"decline_count": req.decline_count + 1},
                    )

                    prev_status = req.status
                    req.status = new_status
                    req.decline_count += 1
                    req.assigned_technician = None
                    req.save()

                    assignment.declined_at = timezone.now()
                    assignment.decline_reason = "timeout"
                    assignment.save()

                    correlation_id = str(uuid.uuid4())
                    log_action(
                        action="assignment.timeout",
                        actor=None,
                        resource_type="request",
                        resource_id=str(req.id),
                        reason="Timeout",
                        metadata={
                            "previous_state": prev_status,
                            "new_state": new_status,
                        },
                    )

                    transaction.on_commit(lambda r_id=req.id, c_id=correlation_id, t_id=assignment.technician.id: DomainEventPublisher.publish_assignment_timeout(
                        request_id=r_id,
                        correlation_id=c_id,
                        actor_id=0,
                        technician_id=t_id,
                    ))
                    processed_ids.append(str(assignment.id))
            except Exception as e:
                logger.error(f"Failed to timeout assignment {assignment.id}: {str(e)}")
                continue

        return processed_ids
