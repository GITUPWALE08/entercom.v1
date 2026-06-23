from django.urls import path

from apps.audit_logs.views.audit_views import AuditLogExportView, AuditLogListView

app_name = "audit_logs"

urlpatterns = [
    path("", AuditLogListView.as_view(), name="list"),
    path("export/", AuditLogExportView.as_view(), name="export"),
]
