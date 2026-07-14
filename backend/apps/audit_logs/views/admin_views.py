"""Audit Administration endpoints."""

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from drf_spectacular.utils import extend_schema

from apps.audit_logs.permissions import HasAuditViewPermission
from apps.audit_logs.services.audit_policy import CRITICAL_PREFIXES, NON_CRITICAL_PREFIXES
from apps.audit_logs.services.retention_service import run_retention
from apps.audit_logs.services.monitoring import _adapters

class AuditPolicyView(APIView):
    """Audit policy management endpoint."""
    permission_classes = [HasAuditViewPermission]

    @extend_schema(summary="Get audit policy prefixes", tags=["audit-admin"])
    def get(self, request):
        return Response({
            "critical_prefixes": CRITICAL_PREFIXES,
            "non_critical_prefixes": NON_CRITICAL_PREFIXES,
        })


class AuditMonitoringView(APIView):
    """Security monitoring endpoint."""
    permission_classes = [HasAuditViewPermission]

    @extend_schema(summary="Get audit monitoring health and adapters", tags=["audit-admin"])
    def get(self, request):
        return Response({
            "status": "healthy",
            "adapters": [type(adapter).__name__ for adapter in _adapters]
        })


class AuditRetentionView(APIView):
    """Retention management endpoint."""
    permission_classes = [HasAuditViewPermission]

    @extend_schema(summary="Trigger manual retention/purge job", tags=["audit-admin"])
    def post(self, request):
        dry_run = str(request.data.get("dry_run", False)).lower() == "true"
        chunk_size = request.data.get("chunk_size", None)
        if chunk_size is not None:
            try:
                chunk_size = int(chunk_size)
            except ValueError:
                chunk_size = None
                
        summary = run_retention(dry_run=dry_run, chunk_size=chunk_size)
        return Response(summary)
