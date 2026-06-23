from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import BookingViewSet, BookingMutationViewSet, TechnicianAvailabilityViewSet

router = DefaultRouter()
router.register(r'bookings', BookingViewSet, basename='booking')
# We map mutations onto the same base prefix, using custom routes
router.register(r'bookings', BookingMutationViewSet, basename='booking-mutation')

technician_router = DefaultRouter()
technician_router.register(r'technicians', TechnicianAvailabilityViewSet, basename='technician-availability')

urlpatterns = [
    path('v1/', include(router.urls)),
    path('v1/', include(technician_router.urls)),
]
