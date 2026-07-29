from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import permissions
from apps.analytics.services import AnalyticsService
from core.permissions import require_permission

class ManagerAnalyticsView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        require_permission(request.user, 'analytics.view_manager')
        data = AnalyticsService.get_manager_dashboard()
        return Response(data)

class AdminAnalyticsView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        require_permission(request.user, 'analytics.view_admin')
        data = AnalyticsService.get_admin_dashboard()
        return Response(data)
