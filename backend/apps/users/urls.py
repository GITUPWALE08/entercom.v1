from django.urls import path

app_name = "users"

from rest_framework.routers import DefaultRouter
from apps.users.views.user import UserViewSet

router = DefaultRouter()
router.register(r'', UserViewSet, basename='user')

urlpatterns: list = router.urls
