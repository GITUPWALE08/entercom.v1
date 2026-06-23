from django.contrib import admin

from apps.audit_logs.models import AuditLogEntry


@admin.register(AuditLogEntry)
class AuditLogEntryAdmin(admin.ModelAdmin):
    list_display = ("created_at", "action", "resource_type", "actor", "request_id")
    list_filter = ("action", "resource_type", "created_at")
    search_fields = ("resource_id", "actor__email", "request_id", "correlation_id")
    readonly_fields = (
        "id",
        "created_at",
        "actor",
        "action",
        "resource_type",
        "resource_id",
        "request_id",
        "correlation_id",
        "ip_address",
        "user_agent",
        "reason",
        "metadata",
    )

    def has_add_permission(self, request) -> bool:
        return False

    def has_change_permission(self, request, obj=None) -> bool:
        return False

    def has_delete_permission(self, request, obj=None) -> bool:
        return False
