from django.urls import path

app_name = "users"

from rest_framework.routers import DefaultRouter
from apps.users.views.user import UserViewSet
from apps.users.views.technician import TechnicianApplicationViewSet

router = DefaultRouter()
router.register(r'technician-applications', TechnicianApplicationViewSet, basename='technician-applications')
router.register(r'', UserViewSet, basename='user')

urlpatterns: list = router.urls
