from django.urls import path

app_name = "roles"

from rest_framework.routers import DefaultRouter
from apps.roles.views.role import RoleViewSet

router = DefaultRouter()
router.register(r'', RoleViewSet, basename='role')

urlpatterns: list = router.urls
