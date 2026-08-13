from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as DjangoUserAdmin

from apps.users.forms import UserAdminChangeForm, UserAdminCreationForm
from apps.users.models import User, PushDevice, TechnicianApplication, TechnicianApplicationActivity

@admin.register(PushDevice)
class PushDeviceAdmin(admin.ModelAdmin):
    list_display = ('user', 'token', 'device_type', 'is_active', 'created_at')
    search_fields = ('user__email', 'token')
    list_filter = ('device_type', 'is_active')


@admin.register(User)
class UserAdmin(DjangoUserAdmin):
    form = UserAdminChangeForm
    add_form = UserAdminCreationForm
    model = User

    filter_horizontal = ("groups", "user_permissions")

    ordering = ("email",)
    list_display = (
        "email",
        "first_name",
        "last_name",
        "role",
        "is_staff",
        "is_superuser",
        "is_active",
        "email_verified",
        "phone_verified",
        "last_login",
        "created_at",
    )
    list_filter = (
        "role",
        "is_staff",
        "is_superuser",
        "is_active",
        "email_verified",
        "phone_verified",
    )
    search_fields = ("email", "first_name", "last_name", "phone_number")
    readonly_fields = (
        "id",
        "password",
        "last_login",
        "created_at",
        "updated_at",
    )

    fieldsets = (
        (None, {"fields": ("email", "password")}),
        (
            "Personal",
            {"fields": ("first_name", "last_name", "phone_number", "profile_image")},
        ),
        (
            "Role & account",
            {
                "fields": (
                    "role",
                    "is_active",
                    "is_staff",
                    "is_superuser",
                    "deleted_at",
                    "last_activity_at",
                ),
            },
        ),
        (
            "Verification",
            {"fields": ("email_verified", "phone_verified")},
        ),
        (
            "Security",
            {
                "fields": (
                    "failed_login_attempts",
                    "last_login_ip",
                    "last_password_change_at",
                    "mfa_enabled",
                ),
            },
        ),
        (
            "Groups & permissions",
            {"fields": ("groups", "user_permissions")},
        ),
        (
            "Timestamps",
            {"fields": ("last_login", "created_at", "updated_at")},
        ),
    )
    add_fieldsets = (
        (
            None,
            {
                "classes": ("wide",),
                "fields": (
                    "email",
                    "password1",
                    "password2",
                    "first_name",
                    "last_name",
                    "role",
                    "is_staff",
                    "is_superuser",
                ),
            },
        ),
    )

@admin.register(TechnicianApplication)
class TechnicianApplicationAdmin(admin.ModelAdmin):
    list_display = ('user', 'status', 'reviewer', 'created_at', 'updated_at')
    list_filter = ('status', 'created_at')
    search_fields = ('user__email', 'user__first_name', 'user__last_name', 'reviewer__email')
    readonly_fields = ('created_at', 'updated_at')

@admin.register(TechnicianApplicationActivity)
class TechnicianApplicationActivityAdmin(admin.ModelAdmin):
    list_display = ('application', 'actor', 'action', 'created_at')
    list_filter = ('action', 'created_at')
    search_fields = ('application__user__email', 'actor__email', 'action')
    readonly_fields = ('created_at',)
