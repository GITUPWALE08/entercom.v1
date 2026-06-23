from django.urls import path
from .views import (
    OrderListView, OrderDetailView, OrderCancelView, OrderFulfillView
)

urlpatterns = [
    path('orders/', OrderListView.as_view()),
    path('orders/<uuid:pk>/', OrderDetailView.as_view()),
    path('orders/<uuid:pk>/cancel/', OrderCancelView.as_view()),
    path('orders/<uuid:pk>/fulfill/', OrderFulfillView.as_view()),
]
