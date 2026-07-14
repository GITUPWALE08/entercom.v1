from django.urls import path
from rest_framework.routers import DefaultRouter
from apps.common.views.maintenance import SystemMaintenanceViewSet

app_name = "system_maintenance"

router = DefaultRouter()
router.register(r'maintenance', SystemMaintenanceViewSet, basename='maintenance')

urlpatterns = router.urls
