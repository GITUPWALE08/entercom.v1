from django.urls import path
from .views import (
    PaymentInitializeView, PaymentDetailView, PaymentCancelView, PaystackWebhookView
)

urlpatterns = [
    path('payments/initialize/', PaymentInitializeView.as_view()),
    path('payments/<uuid:pk>/', PaymentDetailView.as_view()),
    path('payments/<uuid:pk>/cancel/', PaymentCancelView.as_view()),
    path('payments/webhooks/paystack/', PaystackWebhookView.as_view()),
]
