from datetime import timedelta
from typing import Any, Optional, Union

from django.contrib.auth import get_user_model
from django.db import transaction
from django.db.models import Q
from django.utils import timezone

from apps.audit_logs.services.audit_service import log_action
from apps.audit_logs.services.security_audit import (
    audit_approval_denied,
    audit_role_escalation_denied,
)
from apps.roles.hierarchy import get_user_max_hierarchy, user_is_super_admin
from apps.roles.models import (
    ApprovalRequestStatus,
    RoleChangeRequest,
    RoleDefinition,
    UserRole,
)
from apps.roles.services.permission_evaluator import has_permission, invalidate_cache
from apps.authentication.models import UserSession
from apps.authentication.services.auth_service import revoke_all_sessions

User = get_user_model()


class RoleService:
    """Business logic for role assignment and management."""

    @staticmethod
    def get_user_max_hierarchy(user: User) -> int:
        return get_user_max_hierarchy(user)

    @staticmethod
    def is_super_admin(user: User) -> bool:
        return user_is_super_admin(user)

    @staticmethod
    def _enforce_assignment_hierarchy(
        *, assigned_by: User, user: User, role: RoleDefinition
    ) -> None:
        if user.id == assigned_by.id:
            audit_role_escalation_denied(
                actor=assigned_by,
                reason="Users cannot modify their own roles.",
                resource_id=str(user.id),
            )

        actor_hierarchy = get_user_max_hierarchy(assigned_by)
        target_hierarchy = get_user_max_hierarchy(user)
        is_actor_super = user_is_super_admin(assigned_by)

        if role.hierarchy_level >= actor_hierarchy and not is_actor_super:
            audit_role_escalation_denied(
                actor=assigned_by,
                reason="A user cannot assign a role higher than or equal to their own in the hierarchy.",
                resource_id=str(user.id),
                metadata={
                    "role_slug": role.slug,
                    "role_hierarchy": role.hierarchy_level,
                    "actor_hierarchy": actor_hierarchy,
                },
            )
        if target_hierarchy >= actor_hierarchy and not is_actor_super:
            audit_role_escalation_denied(
                actor=assigned_by,
                reason="A user cannot modify a user with a higher or equal hierarchy level.",
                resource_id=str(user.id),
                metadata={
                    "target_hierarchy": target_hierarchy,
                    "actor_hierarchy": actor_hierarchy,
                },
            )

    @staticmethod
    def _enforce_deactivation_hierarchy(
        *, deactivated_by: User, user: User, role: RoleDefinition
    ) -> None:
        if user.id == deactivated_by.id:
            audit_role_escalation_denied(
                actor=deactivated_by,
                reason="Users cannot deactivate their own roles.",
                resource_id=str(user.id),
            )

        actor_hierarchy = get_user_max_hierarchy(deactivated_by)
        target_hierarchy = get_user_max_hierarchy(user)
        is_actor_super = user_is_super_admin(deactivated_by)

        if role.hierarchy_level >= actor_hierarchy and not is_actor_super:
            audit_role_escalation_denied(
                actor=deactivated_by,
                reason="A user cannot deactivate a role higher than or equal to their own in the hierarchy.",
                resource_id=str(user.id),
                metadata={"role_slug": role.slug},
            )
        if target_hierarchy >= actor_hierarchy and not is_actor_super:
            audit_role_escalation_denied(
                actor=deactivated_by,
                reason="A user cannot modify a user with a higher or equal hierarchy level.",
                resource_id=str(user.id),
            )

    @staticmethod
    @transaction.atomic
    def assign_role(
        user: User,
        role_slug: str,
        assigned_by: Optional[User] = None,
        reason: str = "",
        expires_at: Optional[Any] = None,
    ) -> Union[UserRole, RoleChangeRequest]:
        # Lock the user and assigned_by rows to prevent race conditions
        if assigned_by:
            User.objects.select_for_update().filter(id=assigned_by.id).exists()
        User.objects.select_for_update().filter(id=user.id).exists()
        
        role = RoleDefinition.objects.get(slug=role_slug)

        if assigned_by:
            RoleService._enforce_assignment_hierarchy(
                assigned_by=assigned_by, user=user, role=role
            )

        high_tier_slugs = ["staff", "manager", "superadmin"]
        needs_approval = role_slug in high_tier_slugs and (
            not assigned_by
            or (
                not user_is_super_admin(assigned_by)
                and get_user_max_hierarchy(assigned_by) < 100
            )
        )

        if needs_approval:
            request = RoleChangeRequest.objects.create(
                initiator=assigned_by,
                target_user=user,
                requested_role=role,
                status=ApprovalRequestStatus.PENDING,
                expires_at=timezone.now() + timedelta(hours=48),
                reason=reason,
            )

            log_action(
                actor=assigned_by,
                action="roles.change_request_created",
                resource_type="user",
                resource_id=str(user.id),
                reason=reason,
                metadata={
                    "requested_role_slug": role_slug,
                    "request_id": str(request.id),
                },
            )
            return request

        existing = UserRole.objects.filter(user=user, role=role).first()
        old_slug = existing.role.slug if existing else None

        user_role, created = UserRole.objects.update_or_create(
            user=user,
            role=role,
            defaults={
                "assigned_by": assigned_by,
                "reason": reason,
                "expires_at": expires_at,
                "is_active": True,
            },
        )

        log_action(
            actor=assigned_by,
            action="roles.assignment_created" if created else "roles.assignment_updated",
            resource_type="user",
            resource_id=str(user.id),
            reason=reason,
            metadata={
                "role_slug": role_slug,
                "old_role_slug": old_slug,
                "expires_at": expires_at.isoformat() if expires_at else None,
            },
        )

        user.role_version += 1
        user.save(update_fields=["role_version"])
        invalidate_cache(user.id)
        revoke_all_sessions(user)
        return user_role

    @staticmethod
    @transaction.atomic
    def approve_role_change(request: RoleChangeRequest, approved_by: User) -> UserRole:
        if request.status != ApprovalRequestStatus.PENDING:
            log_action(
                actor=approved_by,
                action="roles.approval_denied",
                resource_type="user",
                resource_id=str(request.target_user_id),
                reason="Only pending requests can be approved.",
                metadata={
                    "request_id": str(request.id),
                    "role_slug": request.requested_role.slug,
                },
            )
            raise ValueError("Only pending requests can be approved.")

        if request.initiator_id == approved_by.id:
            audit_approval_denied(
                actor=approved_by,
                reason="Initiator cannot approve their own request (dual-control).",
                resource_id=str(request.target_user_id),
                metadata={"request_id": str(request.id)},
            )

        now = timezone.now()
        if request.expires_at <= now:
            log_action(
                actor=approved_by,
                action="roles.approval_timeout",
                resource_type="user",
                resource_id=str(request.target_user_id),
                reason="This role change request has expired.",
                metadata={
                    "request_id": str(request.id),
                    "role_slug": request.requested_role.slug,
                },
            )
            audit_approval_denied(
                actor=approved_by,
                reason="This role change request has expired.",
                resource_id=str(request.target_user_id),
                metadata={"request_id": str(request.id)},
            )
            raise PermissionDeniedError("This role change request has expired.")

        # Hierarchy check - approver must have higher hierarchy than requested role
        approver_hierarchy = get_user_max_hierarchy(approved_by)
        requested_role_hierarchy = request.requested_role.hierarchy_level
        
        if approver_hierarchy <= requested_role_hierarchy and not user_is_super_admin(approved_by):
            audit_role_escalation_denied(
                actor=approved_by,
                reason="Approver cannot approve a role higher than or equal to their own hierarchy level.",
                resource_id=str(request.target_user_id),
                metadata={
                    "request_id": str(request.id),
                    "role_slug": request.requested_role.slug,
                    "requested_hierarchy": requested_role_hierarchy,
                    "approver_hierarchy": approver_hierarchy,
                },
            )
            raise PermissionDeniedError("Approver cannot approve a role higher than or equal to their own hierarchy level.")

        if not (
            user_is_super_admin(approved_by)
            or has_permission(approved_by, "users.assign_roles")
        ):
            log_action(
                actor=approved_by,
                action="roles.approval_denied",
                resource_type="user",
                resource_id=str(request.target_user_id),
                reason="Approver must hold users.assign_roles or be a Super Admin.",
                metadata={
                    "request_id": str(request.id),
                    "role_slug": request.requested_role.slug,
                },
            )
            audit_approval_denied(
                actor=approved_by,
                reason="Approver must hold users.assign_roles or be a Super Admin.",
                resource_id=str(request.target_user_id),
                metadata={"request_id": str(request.id)},
            )
            raise PermissionDeniedError("Approver must hold users.assign_roles or be a Super Admin.")

        request.status = ApprovalRequestStatus.APPROVED
        request.approved_by = approved_by
        request.save()

        user_role, created = UserRole.objects.update_or_create(
            user=request.target_user,
            role=request.requested_role,
            defaults={
                "assigned_by": request.initiator,
                "approved_by": approved_by,
                "reason": request.reason,
                "is_active": True,
            },
        )

        log_action(
            actor=approved_by,
            action="roles.change_request_approved",
            resource_type="user",
            resource_id=str(request.target_user.id),
            metadata={
                "request_id": str(request.id),
                "role_slug": request.requested_role.slug,
            },
        )

        target = request.target_user

        target.role_version += 1
        target.save(update_fields=["role_version"])

        invalidate_cache(target.id)

        invalidate_cache(request.target_user.id)

        revoke_all_sessions(target)
                
        return user_role

    @staticmethod
    @transaction.atomic
    def reject_role_change(request: RoleChangeRequest, rejected_by: User, reason: str = "") -> RoleChangeRequest:
        if request.status != ApprovalRequestStatus.PENDING:
            log_action(
                actor=rejected_by,
                action="roles.approval_denied",
                resource_type="user",
                resource_id=str(request.target_user_id),
                reason="Only pending requests can be rejected.",
                metadata={
                    "request_id": str(request.id),
                    "role_slug": request.requested_role.slug,
                },
            )
            raise ValueError("Only pending requests can be rejected.")

        if not (
            user_is_super_admin(rejected_by)
            or has_permission(rejected_by, "users.assign_roles")
        ):
            log_action(
                actor=rejected_by,
                action="roles.approval_denied",
                resource_type="user",
                resource_id=str(request.target_user_id),
                reason="Rejecter must hold users.assign_roles or be a Super Admin.",
                metadata={
                    "request_id": str(request.id),
                    "role_slug": request.requested_role.slug,
                },
            )
            audit_approval_denied(
                actor=rejected_by,
                reason="Rejecter must hold users.assign_roles or be a Super Admin.",
                resource_id=str(request.target_user_id),
                metadata={"request_id": str(request.id)},
            )

        request.status = ApprovalRequestStatus.REJECTED
        request.save()

        log_action(
            actor=rejected_by,
            action="roles.approval_rejected",
            resource_type="user",
            resource_id=str(request.target_user.id),
            reason=reason,
            metadata={
                "request_id": str(request.id),
                "role_slug": request.requested_role.slug,
                "approver": str(rejected_by.id),
                "target_user": str(request.target_user.id),
            },
        )

        UserSession.objects.filter(
            user=request.target_user,
            is_active=True
        ).update(is_active=False)

        return request

    @staticmethod
    @transaction.atomic
    def deactivate_role(
        user: User, role_slug: str, deactivated_by: Optional[User] = None
    ) -> None:
        # Lock the user and deactivated_by rows to prevent race conditions
        if deactivated_by:
            User.objects.select_for_update().filter(id=deactivated_by.id).exists()
        User.objects.select_for_update().filter(id=user.id).exists()
        
        role = RoleDefinition.objects.get(slug=role_slug)

        if deactivated_by:
            RoleService._enforce_deactivation_hierarchy(
                deactivated_by=deactivated_by, user=user, role=role
            )

        if role.slug == "superadmin":
            now = timezone.now()
            # USE RAW UserRole to count other active superadmins
            active_superadmin_roles = (
                UserRole.objects.select_for_update()
                .filter(role__slug="superadmin", is_active=True)
                .filter(Q(expires_at__isnull=True) | Q(expires_at__gt=now))
            )
            
            # Count active superadmins excluding the user being deactivated
            active_count_excluding_target = active_superadmin_roles.exclude(user=user).count()
            
            # If deactivating this user would leave zero active superadmins, block it
            if active_count_excluding_target == 0:
                audit_role_escalation_denied(
                    actor=deactivated_by,
                    reason="Cannot deactivate the last remaining Super Admin.",
                    resource_id=str(user.id),
                )
                from core.exceptions import PermissionDeniedError
                raise PermissionDeniedError("Cannot deactivate the last remaining Super Admin.")

        UserRole.objects.filter(user=user, role=role).update(is_active=False)

        log_action(
            actor=deactivated_by,
            action="roles.assignment_deactivated",
            resource_type="user",
            resource_id=str(user.id),
            metadata={"role_slug": role_slug},
        )
        user.role_version += 1
        user.save(update_fields=["role_version"])
        invalidate_cache(user.id)

        revoke_all_sessions(user)
