from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as DjangoUserAdmin

from apps.users.forms import UserAdminChangeForm, UserAdminCreationForm
from apps.users.models import User


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
