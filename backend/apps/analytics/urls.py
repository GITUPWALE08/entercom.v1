from django.urls import path
from apps.analytics.views import ManagerAnalyticsView, AdminAnalyticsView

app_name = "analytics"

urlpatterns = [
    path('manager/', ManagerAnalyticsView.as_view(), name='manager_analytics'),
    path('admin/', AdminAnalyticsView.as_view(), name='admin_analytics'),
]
