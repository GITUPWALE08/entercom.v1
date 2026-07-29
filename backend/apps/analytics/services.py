import json
from django.utils import timezone
from datetime import timedelta
from django.db.models import Count, Sum, Avg, Q
from django.contrib.auth import get_user_model
from apps.requests.models import Request, Quote, Assignment, Verification
from apps.payments.models import Payment
from apps.audit_logs.models import AuditLogEntry

User = get_user_model()

class AnalyticsService:
    @staticmethod
    def get_manager_dashboard():
        now = timezone.now()
        today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
        
        # Requests
        total_requests = Request.objects.count()
        open_requests = Request.objects.filter(state__in=['SUBMITTED', 'VERIFIED', 'QUOTED', 'ASSIGNED', 'IN_PROGRESS', 'COMPLETED_PENDING_VERIFICATION']).count()
        
        # Active Jobs (assigned & in progress)
        active_jobs = Request.objects.filter(state__in=['ASSIGNED', 'IN_PROGRESS']).count()
        
        # Quotes & Verifications
        pending_quotes = Quote.objects.filter(status='PENDING').count()
        pending_verifications = Verification.objects.filter(status='PENDING').count()
        
        # Users & Techs
        active_techs = User.objects.filter(is_active=True, role_assignments__role__slug='technician', role_assignments__is_active=True).distinct().count()
        
        # Payments
        revenue_today = Payment.objects.filter(status='COMPLETED', created_at__gte=today_start).aggregate(Sum('amount'))['amount__sum'] or 0
        
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
            "charts": {}
        }

    @staticmethod
    def get_admin_dashboard():
        manager_data = AnalyticsService.get_manager_dashboard()
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
