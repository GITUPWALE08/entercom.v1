from django.urls import path

from apps.audit_logs.views.audit_views import AuditLogExportView, AuditLogListView
from apps.audit_logs.views.admin_views import (
    AuditPolicyView,
    AuditMonitoringView,
    AuditRetentionView,
)

app_name = "audit_logs"

urlpatterns = [
    path("", AuditLogListView.as_view(), name="list"),
    path("export/", AuditLogExportView.as_view(), name="export"),
    path("policy/", AuditPolicyView.as_view(), name="policy"),
    path("monitoring/", AuditMonitoringView.as_view(), name="monitoring"),
    path("retention/run/", AuditRetentionView.as_view(), name="retention_run"),
]
