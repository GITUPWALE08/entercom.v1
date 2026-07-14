import io
from django.core.management import call_command
from rest_framework import viewsets, permissions, status
from rest_framework.response import Response
from rest_framework.decorators import action
from drf_spectacular.utils import extend_schema

from apps.audit_logs.services.audit_service import log_action
from apps.payments.services.payment_service import PaymentService

class IsSuperAdmin(permissions.BasePermission):
    """
    Allows access only to superadmin users.
    """
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and (getattr(request.user, 'role', '') == 'superadmin' or request.user.is_superuser))


class SystemMaintenanceViewSet(viewsets.ViewSet):
    permission_classes = [IsSuperAdmin]

    def _run_command(self, request, command_name: str, action_name: str):
        out = io.StringIO()
        err = io.StringIO()
        try:
            call_command(command_name, stdout=out, stderr=err)
            output = out.getvalue()
            error_output = err.getvalue()
            
            summary = output if output else "Completed successfully."
            if error_output:
                summary += f"\nErrors: {error_output}"
                
            log_action(
                action=action_name,
                actor=request.user,
                resource_type="system",
                reason=f"Executed {command_name} management command"
            )
            return Response({"status": "success", "summary": summary}, status=status.HTTP_200_OK)
        except Exception as e:
            log_action(
                action=action_name,
                actor=request.user,
                resource_type="system",
                reason=f"Failed to execute {command_name}: {str(e)}"
            )
            return Response({"status": "error", "summary": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @extend_schema(summary="Run role expiration cleanup")
    @action(detail=False, methods=['post'])
    def cleanup_roles(self, request):
        return self._run_command(request, 'cleanup_expired_roles', 'maintenance.cleanup_roles')

    @extend_schema(summary="Run log archival")
    @action(detail=False, methods=['post'])
    def archive_logs(self, request):
        return self._run_command(request, 'audit_retention', 'maintenance.archive_logs')

    @extend_schema(summary="Run payment intent cleanup")
    @action(detail=False, methods=['post'])
    def cleanup_payments(self, request):
        try:
            # We reuse the logic already executed by the celery task expire_payments_job
            PaymentService.expire_payments(actor=request.user, correlation_id=f"maintenance-{request.user.id}")
            log_action(
                action="maintenance.cleanup_payments",
                actor=request.user,
                resource_type="system",
                reason="Executed payment intent cleanup"
            )
            return Response({"status": "success", "summary": "Payment intent cleanup completed successfully."}, status=status.HTTP_200_OK)
        except Exception as e:
            log_action(
                action="maintenance.cleanup_payments",
                actor=request.user,
                resource_type="system",
                reason=f"Failed to execute payment intent cleanup: {str(e)}"
            )
            return Response({"status": "error", "summary": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @extend_schema(summary="Get execution history")
    @action(detail=False, methods=['get'])
    def execution_history(self, request):
        # Implementation of "Execution history" from the prompt.
        # This returns recent audit logs for the maintenance actions.
        from apps.audit_logs.models import AuditLogEntry
        actions = ['maintenance.cleanup_roles', 'maintenance.archive_logs', 'maintenance.cleanup_payments']
        logs = AuditLogEntry.objects.filter(action__in=actions).order_by('-created_at')[:50]
        data = [{
            "id": str(log.id),
            "action": log.action,
            "actor_id": str(log.actor_id) if log.actor_id else None,
            "reason": log.reason,
            "created_at": log.created_at.isoformat() if log.created_at else None
        } for log in logs]
        
        return Response({"history": data}, status=status.HTTP_200_OK)
