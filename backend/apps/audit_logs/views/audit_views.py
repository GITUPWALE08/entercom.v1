"""Audit log read/export API (adapter layer — no audit writes)."""

from django.http import HttpResponse
from rest_framework import status
from rest_framework.pagination import PageNumberPagination
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.audit_logs.permissions import HasAuditViewPermission
from apps.audit_logs.serializers.audit_serializers import AuditLogFilterSerializer
from apps.audit_logs.services.query_service import export_csv, export_json, list_entries, serialize_entry


class AuditLogPagination(PageNumberPagination):
    page_size = 50
    page_size_query_param = "page_size"
    max_page_size = 200


class AuditLogListView(APIView):
    permission_classes = [HasAuditViewPermission]
    pagination_class = AuditLogPagination

    def get(self, request):
        filters = AuditLogFilterSerializer(data=request.query_params)
        filters.is_valid(raise_exception=True)
        data = filters.validated_data

        qs = list_entries(
            action=data.get("action"),
            actor_email=data.get("actor_email"),
            resource_type=data.get("resource_type"),
            request_id=data.get("request_id"),
            correlation_id=data.get("correlation_id"),
            date_from=data.get("date_from"),
            date_to=data.get("date_to"),
        )

        paginator = self.pagination_class()
        page = paginator.paginate_queryset(qs, request)
        payload = [serialize_entry(entry) for entry in page]
        return paginator.get_paginated_response(payload)


class AuditLogExportView(APIView):
    permission_classes = [HasAuditViewPermission]

    def get(self, request):
        filters = AuditLogFilterSerializer(data=request.query_params)
        filters.is_valid(raise_exception=True)
        data = filters.validated_data
        export_format = request.query_params.get("format", "json").lower()

        qs = list_entries(
            action=data.get("action"),
            actor_email=data.get("actor_email"),
            resource_type=data.get("resource_type"),
            request_id=data.get("request_id"),
            correlation_id=data.get("correlation_id"),
            date_from=data.get("date_from"),
            date_to=data.get("date_to"),
        )

        if export_format == "csv":
            content = export_csv(qs)
            response = HttpResponse(content, content_type="text/csv")
            response["Content-Disposition"] = 'attachment; filename="audit_logs.csv"'
            return response

        content = export_json(qs)
        return Response(content, status=status.HTTP_200_OK)
