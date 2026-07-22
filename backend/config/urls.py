from django.conf import settings
from django.contrib import admin
from django.urls import include, path

from apps.common.views.health import health_check

urlpatterns = [
    path("admin/", admin.site.urls),
    path("health/", health_check, name="health"),
    path("api/v1/auth/", include("apps.authentication.urls")),
    path("api/v1/users/", include("apps.users.urls")),
    path("api/v1/roles/", include("apps.roles.urls")),
    path("api/v1/requests/", include("apps.requests.api.urls")),
    path("api/", include("apps.bookings.api.urls")),
    path("api/v1/notifications/", include("apps.notification.urls")),
    path("api/v1/chat/", include("apps.chat.urls")),
    #path("api/v1/ai-support/", include("apps.ai_support.urls")),
    path("api/v1/", include("apps.products.api.urls")),
    path("api/v1/", include("apps.orders.api.urls")),
    path("api/v1/", include("apps.payments.api.urls")),
    #path("api/v1/analytics/", include("apps.analytics.urls")),
    path("api/v1/audit-logs/", include("apps.audit_logs.urls")),
    path("api/v1/system/", include("apps.common.urls")),
    #path("api/v1/technicians/", include("apps.technicians.urls")),
]

if settings.ENABLE_SPECTACULAR:
    from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView

    urlpatterns += [
        path("api/v1/schema/", SpectacularAPIView.as_view(), name="schema"),
        path(
            "api/v1/schema/swagger-ui/",
            SpectacularSwaggerView.as_view(url_name="schema"),
            name="swagger-ui",
        ),
    ]
