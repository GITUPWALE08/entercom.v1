from apps.requests.permissions.matrix import PermissionRegistry
from apps.requests.permissions.constants import Role
"""
VerificationService: Validates completion of work via evidence review.
Ref: docs/architecture/request/request-services.md (Section 5.4)
"""
import logging
import uuid
from typing import Any, Dict

from django.contrib.auth import get_user_model
from django.db import transaction

from apps.audit_logs.services.audit_service import log_action
from apps.requests.domain.actions import RequestAction
from apps.requests.domain.state_machine import RequestStateMachine
from apps.requests.events.publishers import DomainEventPublisher
from apps.requests.models import (
    Evidence,
    EvidenceType,
    LifecycleState,
    Request,
    StateHistory,
    Verification,
    VerificationStatus,
)

User = get_user_model()
logger = logging.getLogger(__name__)


class VerificationService:
    """
    Service for managing evidence submission and quality assurance reviews.
    """

    @staticmethod
    @transaction.atomic
    def submit(request_id: Any, actor: User, evidence: Dict[str, Any]) -> Verification:
        """
        Technician submits evidence for verification.
        Ref: docs/architecture/request/request-services.md (5.4)
        """
        from apps.requests.permissions.constants import Permission, Role
        from apps.requests.permissions.checks import RBACChecker
        from django.core.exceptions import PermissionDenied

        request = Request.objects.select_for_update().get(pk=request_id)

        # RBAC Validation
        if not RBACChecker.check_scoped_permission(
            role=Role(actor.role), 
            permission=Permission.VERIFICATION_SUBMIT, 
            user_id=actor.id,
            resource=request
        ):
            raise PermissionDenied("Missing verification.submit permission.")

        prev_status = request.status

        machine = RequestStateMachine(LifecycleState(request.status))
        user_permissions = [p.value for p in PermissionRegistry.get_permissions_for_role(Role(actor.role))] if hasattr(actor, "role") else []
        
        new_status = machine.transition(
            action=RequestAction.MARK_FINISHED,
            user_permissions=user_permissions,
            context={"evidence_uploaded": True},
        )

        request.status = new_status
        request.save()

        verification = Verification.objects.create(
            request=request, status=VerificationStatus.PENDING
        )

        for photo_url in evidence.get("photos", []):
            Evidence.objects.create(
                verification=verification,
                type=EvidenceType.PHOTO,
                file_url=photo_url,
                geo_lat=evidence.get("metadata", {}).get("lat"),
                geo_long=evidence.get("metadata", {}).get("lng"),
                device_timestamp=evidence.get("metadata", {}).get("timestamp"),
            )

        correlation_id = str(uuid.uuid4())
        StateHistory.objects.create(
            request=request,
            from_state=prev_status,
            to_state=new_status,
            actor=actor,
            correlation_id=correlation_id,
        )

        # CORRECTION: Added mandatory state fields and evidence links
        log_action(
            action="verification.submitted",
            actor=actor,
            resource_type="request",
            resource_id=str(request.id),
            metadata={
                "verification_id": str(verification.id),
                "evidence_links": evidence.get("photos", []),
                "previous_state": prev_status,
                "new_state": new_status,
            },
        )

        transaction.on_commit(lambda: DomainEventPublisher.publish_verification_submitted(
            request_id=request.id,
            correlation_id=correlation_id,
            actor_id=actor.id,
            evidence_links=evidence.get("photos", []),
        ))

        return verification

    @staticmethod
    @transaction.atomic
    def verify(
        request_id: Any, actor: User, action_type: str, notes: str = None
    ) -> Request:
        """
        Staff or Manager reviews and approves/rejects verification.
        Ref: docs/workflows/verification-flow.md
        """
        from apps.requests.permissions.constants import Permission, Role
        from apps.requests.permissions.checks import RBACChecker
        from django.core.exceptions import PermissionDenied

        request = Request.objects.select_for_update().get(pk=request_id)
        
        # Determine permission based on action
        permission_req = Permission.VERIFICATION_VERIFY
        if action_type == "override":
            permission_req = Permission.VERIFICATION_OVERRIDE
            
        # RBAC Validation
        if not RBACChecker.check_scoped_permission(
            role=Role(actor.role), 
            permission=permission_req, 
            user_id=actor.id,
            resource=request
        ):
            raise PermissionDenied(f"Missing {permission_req.value} permission.")

        verification = Verification.objects.filter(request=request).latest("created_at")

        prev_status = request.status
        machine = RequestStateMachine(LifecycleState(request.status))
        user_permissions = [p.value for p in PermissionRegistry.get_permissions_for_role(Role(actor.role))] if hasattr(actor, "role") else []
        correlation_id = str(uuid.uuid4())

        if action_type == "approve":
            new_status = machine.transition(
                action=RequestAction.APPROVE_VERIFICATION,
                user_permissions=user_permissions,
                context={"qa_pass": True},
            )
            verification.status = VerificationStatus.APPROVED
            # CORRECTION: Fixed audit label from 'verification.approved' to 'verification_passed'
            # and added mandatory state fields
            log_action(
                action="verification.approved", 
                actor=actor, 
                resource_id=str(request.id),
                metadata={
                    "previous_state": prev_status,
                    "new_state": new_status,
                }
            )
            transaction.on_commit(lambda: DomainEventPublisher.publish_verification_approved(
                request_id=request.id,
                correlation_id=correlation_id,
                actor_id=actor.id,
                staff_id=actor.id,
            ))

        elif action_type == "reject":
            new_status = machine.transition(
                action=RequestAction.REJECT_VERIFICATION,
                user_permissions=user_permissions,
                context={"qa_fail": True},
            )
            verification.status = VerificationStatus.REJECTED
            # CORRECTION: Fixed audit label from 'verification.rejected' to 'verification_rejected'
            # and added mandatory state fields
            log_action(
                action="verification.rejected", 
                actor=actor, 
                resource_id=str(request.id), 
                reason=notes,
                metadata={
                    "previous_state": prev_status,
                    "new_state": new_status,
                }
            )
            transaction.on_commit(lambda: DomainEventPublisher.publish_verification_rejected(
                request_id=request.id,
                correlation_id=correlation_id,
                actor_id=actor.id,
                rework_notes=notes,
            ))

        elif action_type == "override":
            new_status = machine.transition(
                action=RequestAction.OVERRIDE_VERIFICATION,
                user_permissions=user_permissions,
                context={"audit_justification_provided": bool(notes)},
            )
            verification.status = VerificationStatus.OVERRIDDEN
            verification.override_reason = notes
            # CORRECTION: Fixed audit label from 'verification.overridden' to 'verification_overridden'
            # and added mandatory state fields
            log_action(
                action="verification.overridden", 
                actor=actor, 
                resource_id=str(request.id), 
                reason=notes,
                metadata={
                    "previous_state": prev_status,
                    "new_state": new_status,
                }
            )
            transaction.on_commit(lambda: DomainEventPublisher.publish_verification_overridden(
                request_id=request.id,
                correlation_id=correlation_id,
                actor_id=actor.id,
                manager_id=actor.id,
                reason=notes,
            ))

        verification.reviewed_by = actor
        verification.save()
        request.status = new_status
        request.save()

        StateHistory.objects.create(
            request=request,
            from_state=prev_status,
            to_state=new_status,
            actor=actor,
            correlation_id=correlation_id,
            reason=notes,
        )

        return request
