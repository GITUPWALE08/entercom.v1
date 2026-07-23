from django.db import transaction
from django.core.exceptions import ValidationError
from apps.users.models import TechnicianApplication, TechnicianApplicationStatus, User
from apps.roles.services.role_service import RoleService
from core.events import event_publisher
from django.utils import timezone
import uuid

class TechnicianOnboardingService:
    @staticmethod
    @transaction.atomic
    def submit_application(user, skills, document_urls, notes=""):
        if TechnicianApplication.objects.filter(user=user, status__in=[TechnicianApplicationStatus.PENDING, TechnicianApplicationStatus.UNDER_REVIEW]).exists():
            raise ValidationError("You already have an active application.")
        
        app, created = TechnicianApplication.objects.update_or_create(
            user=user,
            defaults={
                "skills": skills,
                "document_urls": document_urls,
                "notes": notes,
                "status": TechnicianApplicationStatus.PENDING
            }
        )
        
        event_publisher.publish(
            event_name='technician_application.submitted',
            event_version=1,
            correlation_id=str(app.id),
            occurred_at=timezone.now(),
            producer='TechnicianOnboardingService',
            data={'user_id': str(user.id)}
        )
        return app

    @staticmethod
    @transaction.atomic
    def review_application(manager, app_id):
        try:
            app = TechnicianApplication.objects.select_for_update().get(id=app_id)
        except TechnicianApplication.DoesNotExist:
            raise ValidationError("Application not found.")
            
        if app.status != TechnicianApplicationStatus.PENDING:
            raise ValidationError("Application is not in pending state.")
        
        app.status = TechnicianApplicationStatus.UNDER_REVIEW
        app.save()
        return app

    @staticmethod
    @transaction.atomic
    def decide_application(manager, app_id, status):
        try:
            app = TechnicianApplication.objects.select_for_update().get(id=app_id)
        except TechnicianApplication.DoesNotExist:
            raise ValidationError("Application not found.")
            
        if status not in [TechnicianApplicationStatus.APPROVED, TechnicianApplicationStatus.REJECTED]:
            raise ValidationError("Invalid status.")
            
        app.status = status
        app.save()

        if status == TechnicianApplicationStatus.APPROVED:
            RoleService.assign_role(user=app.user, role_slug='technician', assigned_by=manager, reason="Application Approved")
            event_publisher.publish(
                event_name='technician.approved',
                event_version=1,
                correlation_id=str(app.id),
                occurred_at=timezone.now(),
                producer='TechnicianOnboardingService',
                data={'user_id': str(app.user_id)}
            )
        else:
            event_publisher.publish(
                event_name='technician.rejected',
                event_version=1,
                correlation_id=str(app.id),
                occurred_at=timezone.now(),
                producer='TechnicianOnboardingService',
                data={'user_id': str(app.user_id)}
            )
            
        return app
