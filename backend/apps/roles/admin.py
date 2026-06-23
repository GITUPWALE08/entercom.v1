from django.contrib import admin

from apps.roles.models import (
    ApprovalRequest,
    PermissionCacheVersion,
    PermissionDefinition,
    RoleChangeRequest,
    RoleDefinition,
    RolePermission,
    UserRole,
)


@admin.register(PermissionDefinition)
class PermissionDefinitionAdmin(admin.ModelAdmin):
    list_display = ("codename", "name", "resource", "action", "is_active")
    list_filter = ("resource", "is_active")
    search_fields = ("codename", "name", "resource", "action")

    def get_readonly_fields(self, request, obj=None):
        if obj:  # editing an existing object
            return self.readonly_fields + ("codename",)
        return self.readonly_fields


class RolePermissionInline(admin.TabularInline):
    model = RolePermission
    extra = 1
    autocomplete_fields = ("permission",)


@admin.register(RoleDefinition)
class RoleDefinitionAdmin(admin.ModelAdmin):
    list_display = ("name", "slug", "hierarchy_level", "is_system_role", "is_active")
    list_filter = ("is_system_role", "is_active")
    search_fields = ("name", "slug")
    inlines = [RolePermissionInline]

    def get_readonly_fields(self, request, obj=None):
        if obj:
            return self.readonly_fields + ("slug", "hierarchy_level")
        return self.readonly_fields


@admin.register(RolePermission)
class RolePermissionAdmin(admin.ModelAdmin):
    list_display = ("role", "permission", "created_by", "granted_at")
    search_fields = ("role__name", "permission__codename")
    autocomplete_fields = ("role", "permission")


@admin.register(UserRole)
class UserRoleAdmin(admin.ModelAdmin):
    list_display = ("user", "role", "is_active", "expires_at", "created_at")
    list_filter = ("is_active", "role")
    search_fields = ("user__email", "role__name")
    autocomplete_fields = ("user", "role", "assigned_by", "approved_by")


@admin.register(ApprovalRequest)
class ApprovalRequestAdmin(admin.ModelAdmin):
    list_display = ("request_type", "status", "initiator", "target_user", "created_at")
    list_filter = ("status", "request_type")
    search_fields = ("initiator__email", "target_user__email", "request_type")
    autocomplete_fields = ("initiator", "target_user", "approved_by")
    readonly_fields = ("initiator", "target_user")


@admin.register(RoleChangeRequest)
class RoleChangeRequestAdmin(admin.ModelAdmin):
    list_display = ("target_user", "requested_role", "status", "initiator", "approved_by")
    list_filter = ("status",)
    search_fields = ("target_user__email", "initiator__email")
    autocomplete_fields = ("initiator", "target_user", "requested_role", "approved_by")
    readonly_fields = ("initiator", "target_user", "requested_role")


@admin.register(PermissionCacheVersion)
class PermissionCacheVersionAdmin(admin.ModelAdmin):
    list_display = ("user", "version", "updated_at")
    search_fields = ("user__email",)
    autocomplete_fields = ("user",)
    readonly_fields = ("user", "version")
