from django.urls import path, include
from rest_framework.routers import DefaultRouter
from apps.users.views.user import UserViewSet
from apps.users.views.technician import TechnicianApplicationViewSet

app_name = "users"

router = DefaultRouter()
router.register(r'technician-applications', TechnicianApplicationViewSet, basename='technician-applications')
router.register(r'', UserViewSet, basename='user')

urlpatterns = [
    path('register-device/', UserViewSet.as_view({'post': 'register_push_device'}), name='register-device'),
    path('', include(router.urls)),
]
