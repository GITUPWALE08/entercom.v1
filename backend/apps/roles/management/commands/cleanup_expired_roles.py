from core.management.base import AuditTraceCommand
from django.utils import timezone
from apps.roles.models import UserRole, RoleChangeRequest, ApprovalRequest, ApprovalRequestStatus
from apps.audit_logs.services.audit_service import log_action

class Command(AuditTraceCommand):
    help = "Deactivates expired temporary role assignments and rejects expired requests."

    def handle(self, *args, **options):
        now = timezone.now()
        
        # 1. Expired Role Assignments
        expired_roles = UserRole.objects.filter(
            expires_at__lte=now,
            is_active=True
        )
        
        count = expired_roles.count()
        if count > 0:
            for user_role in expired_roles:
                user_role.is_active = False
                user_role.save()
                
                # Increment role_version to invalidate JWT claims
                user_role.user.role_version += 1
                user_role.user.save(update_fields=["role_version"])
                
                log_action(
                    action="roles.assignment_expired",
                    resource_type="user",
                    resource_id=str(user_role.user.id),
                    reason="Automatic cleanup of expired temporary role",
                    metadata={"role_slug": user_role.role.slug}
                )
                
                from apps.roles.services.permission_evaluator import invalidate_cache
                invalidate_cache(user_role.user.id)

            self.stdout.write(self.style.SUCCESS(f"Successfully deactivated {count} expired roles."))
        else:
            self.stdout.write(self.style.SUCCESS("No expired roles found."))

        # 2. Expired RoleChangeRequests
        expired_role_changes = RoleChangeRequest.objects.filter(
            status=ApprovalRequestStatus.PENDING,
            expires_at__lte=now
        )
        
        rc_count = expired_role_changes.count()
        if rc_count > 0:
            for req in expired_role_changes:
                req.status = ApprovalRequestStatus.EXPIRED
                req.save()
                
                duration = now - req.created_at
                log_action(
                    action="roles.approval_timeout",
                    actor=None,
                    resource_type="user",
                    resource_id=str(req.target_user.id),
                    reason="Request expired without approval",
                    metadata={
                        "expired_request": str(req.id),
                        "role": req.requested_role.slug,
                        "duration": str(duration)
                    }
                )
            self.stdout.write(self.style.SUCCESS(f"Successfully expired {rc_count} role change requests."))

        # 3. Expired ApprovalRequests
        expired_approvals = ApprovalRequest.objects.filter(
            status=ApprovalRequestStatus.PENDING,
            expires_at__lte=now
        )
        
        app_count = expired_approvals.count()
        if app_count > 0:
            for req in expired_approvals:
                req.status = ApprovalRequestStatus.EXPIRED
                req.save()
                
                duration = now - req.created_at
                log_action(
                    action="roles.approval_timeout",
                    actor=None,
                    resource_type="approval",
                    resource_id=str(req.id),
                    reason="Request expired without approval",
                    metadata={
                        "expired_request": str(req.id),
                        "request_type": req.request_type,
                        "duration": str(duration)
                    }
                )
            self.stdout.write(self.style.SUCCESS(f"Successfully expired {app_count} approval requests."))
