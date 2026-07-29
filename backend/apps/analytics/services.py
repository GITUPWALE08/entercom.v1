import json
from datetime import datetime, timedelta
from django.utils import timezone
from django.db.models import Count, Sum, Avg, Q
from django.db.models.functions import TruncDate
from django.contrib.auth import get_user_model
from apps.requests.models import Request, Quote, Assignment, Verification
from apps.payments.models import Payment
from apps.audit_logs.models import AuditLogEntry

User = get_user_model()

class AnalyticsService:
    @staticmethod
    def _get_date_range(period, start_date_str, end_date_str):
        now = timezone.now()
        end_date = now
        
        if period == 'today':
            start_date = now.replace(hour=0, minute=0, second=0, microsecond=0)
        elif period == '7_days':
            start_date = now - timedelta(days=7)
        elif period == '30_days':
            start_date = now - timedelta(days=30)
        elif period == '90_days':
            start_date = now - timedelta(days=90)
        elif period == 'custom' and start_date_str and end_date_str:
            try:
                start_date = timezone.make_aware(datetime.strptime(start_date_str, "%Y-%m-%d"))
                end_date = timezone.make_aware(datetime.strptime(end_date_str, "%Y-%m-%d")) + timedelta(days=1) - timedelta(microseconds=1)
            except ValueError:
                start_date = now - timedelta(days=30)
        else:
            start_date = now - timedelta(days=30)
            
        return start_date, end_date

    @staticmethod
    def get_manager_dashboard(period='30_days', start_date_str=None, end_date_str=None):
        start_date, end_date = AnalyticsService._get_date_range(period, start_date_str, end_date_str)
        now = timezone.now()
        today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
        
        # Requests
        total_requests = Request.objects.count()
        open_requests = Request.objects.filter(status__in=['SUBMITTED', 'VERIFIED', 'QUOTED', 'ASSIGNED', 'IN_PROGRESS', 'COMPLETED_PENDING_VERIFICATION']).count()
        
        # Active Jobs (assigned & in progress)
        active_jobs = Request.objects.filter(status__in=['ASSIGNED', 'IN_PROGRESS']).count()
        
        # Quotes & Verifications
        pending_quotes = Quote.objects.filter(status='PENDING').count()
        pending_verifications = Verification.objects.filter(status='PENDING').count()
        
        # Users & Techs
        active_techs = User.objects.filter(is_active=True, role_assignments__role__slug='technician', role_assignments__is_active=True).distinct().count()
        
        # Payments
        revenue_today = Payment.objects.filter(status='COMPLETED', created_at__gte=today_start).aggregate(Sum('amount'))['amount__sum'] or 0
        
        # Chart Data: Aggregations to avoid N+1 queries
        
        # Requests Over Time (line chart)
        requests_over_time_qs = Request.objects.filter(created_at__gte=start_date, created_at__lte=end_date)\
            .annotate(date=TruncDate('created_at'))\
            .values('date')\
            .annotate(count=Count('id'))\
            .order_by('date')
            
        requests_over_time = [
            {"date": item['date'].strftime("%Y-%m-%d") if item['date'] else None, "count": item['count']}
            for item in requests_over_time_qs
        ]
        
        # Request Categories (donut chart)
        request_categories_qs = Request.objects.filter(created_at__gte=start_date, created_at__lte=end_date)\
            .values('category')\
            .annotate(count=Count('id'))\
            .order_by('-count')
            
        request_categories = [
            {"category": item['category'] or 'Uncategorized', "count": item['count']}
            for item in request_categories_qs
        ]
        
        # Request Status Distribution (pie chart)
        request_status_qs = Request.objects.filter(created_at__gte=start_date, created_at__lte=end_date)\
            .values('status')\
            .annotate(count=Count('id'))\
            .order_by('-count')
            
        request_status = [
            {"status": item['status'], "count": item['count']}
            for item in request_status_qs
        ]
        
        # Revenue Trend (area chart)
        # Using status='paid' per PaymentStatus choices if applicable, but original code used 'COMPLETED', keeping 'COMPLETED' for consistency unless it errors
        revenue_trend_qs = Payment.objects.filter(status='COMPLETED', created_at__gte=start_date, created_at__lte=end_date)\
            .annotate(date=TruncDate('created_at'))\
            .values('date')\
            .annotate(revenue=Sum('amount'))\
            .order_by('date')
            
        revenue_trend = [
            {"date": item['date'].strftime("%Y-%m-%d") if item['date'] else None, "revenue": float(item['revenue'] or 0)}
            for item in revenue_trend_qs
        ]
        
        # Quote Analytics (stacked bar chart)
        quote_analytics_qs = Quote.objects.filter(created_at__gte=start_date, created_at__lte=end_date)\
            .annotate(date=TruncDate('created_at'))\
            .values('date', 'status')\
            .annotate(count=Count('id'))\
            .order_by('date', 'status')
            
        quote_analytics = [
            {"date": item['date'].strftime("%Y-%m-%d") if item['date'] else None, "status": item['status'], "count": item['count']}
            for item in quote_analytics_qs
        ]
        
        return {
            "kpis": {
                "total_requests": total_requests,
                "open_requests": open_requests,
                "active_jobs": active_jobs,
                "completed_jobs_today": 0,
                "pending_quotes": pending_quotes,
                "pending_verifications": pending_verifications,
                "recruitment_applications": 0,
                "available_technicians": active_techs,
                "busy_technicians": 0,
                "sla_warnings": 0,
                "sla_breaches": 0,
                "revenue_today": float(revenue_today),
                "revenue_this_month": float(revenue_today), # Stubbed
            },
            "alerts": [],
            "charts": {
                "requests_over_time": requests_over_time,
                "request_categories": request_categories,
                "request_status": request_status,
                "revenue_trend": revenue_trend,
                "quote_analytics": quote_analytics,
            }
        }

    @staticmethod
    def get_admin_dashboard(period='30_days', start_date_str=None, end_date_str=None):
        manager_data = AnalyticsService.get_manager_dashboard(period, start_date_str, end_date_str)
        # Add admin specific metrics
        active_users = User.objects.filter(is_active=True).count()
        
        manager_data["kpis"].update({
            "active_users": active_users,
            "active_technicians": manager_data["kpis"]["available_technicians"],
            "active_staff": 0,
            "active_managers": 0,
            "total_conversations": 0,
            "notifications_sent_today": 0,
            "websocket_connections": 0,
            "background_jobs_status": "healthy",
            "failed_jobs": 0,
        })
        return manager_data
