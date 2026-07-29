from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import permissions
from apps.analytics.services import AnalyticsService
from core.permissions import require_permission

class ManagerAnalyticsView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        require_permission(request.user, 'analytics.view_manager')
        period = request.query_params.get('period', '30_days')
        start_date_str = request.query_params.get('start_date')
        end_date_str = request.query_params.get('end_date')
        
        data = AnalyticsService.get_manager_dashboard(
            period=period,
            start_date_str=start_date_str,
            end_date_str=end_date_str
        )
        return Response(data)

class AdminAnalyticsView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        require_permission(request.user, 'analytics.view_admin')
        period = request.query_params.get('period', '30_days')
        start_date_str = request.query_params.get('start_date')
        end_date_str = request.query_params.get('end_date')
        
        data = AnalyticsService.get_admin_dashboard(
            period=period,
            start_date_str=start_date_str,
            end_date_str=end_date_str
        )
        return Response(data)
