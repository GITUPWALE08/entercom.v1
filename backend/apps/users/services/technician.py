from django.db import transaction
from django.core.exceptions import ValidationError
from apps.users.models import TechnicianApplication, TechnicianApplicationStatus, TechnicianApplicationActivity, User
from apps.roles.services.role_service import RoleService
from core.events import event_publisher
from django.utils import timezone
import uuid

class TechnicianOnboardingService:
    @staticmethod
    def _log_activity(application, actor, action, details=""):
        TechnicianApplicationActivity.objects.create(
            application=application,
            actor=actor,
            action=action,
            details=details
        )

    @staticmethod
    @transaction.atomic
    def submit_application(user, skills, document_urls, form_data=None, notes=""):
        if TechnicianApplication.objects.filter(user=user, status__in=[TechnicianApplicationStatus.PENDING, TechnicianApplicationStatus.UNDER_REVIEW]).exists():
            raise ValidationError("You already have an active application.")
        
        app, created = TechnicianApplication.objects.update_or_create(
            user=user,
            defaults={
                "skills": skills,
                "document_urls": document_urls,
                "form_data": form_data or {},
                "notes": notes,
                "status": TechnicianApplicationStatus.PENDING
            }
        )
        
        TechnicianOnboardingService._log_activity(app, user, "Application Submitted", "User submitted technician application.")
        
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
        app.reviewer = manager
        app.save()

        TechnicianOnboardingService._log_activity(app, manager, "Review Started", "Manager began reviewing application.")

        return app

    @staticmethod
    @transaction.atomic
    def decide_application(manager, app_id, status=None, reviewer_id=None, notes=None, rejection_reason=None):
        try:
            app = TechnicianApplication.objects.select_for_update().get(id=app_id)
        except TechnicianApplication.DoesNotExist:
            raise ValidationError("Application not found.")
            
        if notes:
            app.notes = app.notes + f"\n[{timezone.now().strftime('%Y-%m-%d %H:%M')}] {manager.get_full_name()}: {notes}"
            app.save()
            TechnicianOnboardingService._log_activity(app, manager, "Notes Added", notes)

        if reviewer_id:
            try:
                new_reviewer = User.objects.get(id=reviewer_id)
                app.reviewer = new_reviewer
                app.save()
                TechnicianOnboardingService._log_activity(app, manager, "Reviewer Assigned", f"Assigned to {new_reviewer.get_full_name()}")
            except User.DoesNotExist:
                raise ValidationError("Reviewer not found.")

        if status:
            if status not in [choice[0] for choice in TechnicianApplicationStatus.choices]:
                raise ValidationError("Invalid status.")
            
            app.status = status
            
            if status == TechnicianApplicationStatus.REJECTED:
                if rejection_reason:
                    app.rejection_reason = rejection_reason
                TechnicianOnboardingService._log_activity(app, manager, "Application Rejected", rejection_reason or "No reason provided.")
                event_publisher.publish(
                    event_name='technician.rejected',
                    event_version=1,
                    correlation_id=str(app.id),
                    occurred_at=timezone.now(),
                    producer='TechnicianOnboardingService',
                    data={'user_id': str(app.user_id), 'reason': app.rejection_reason}
                )
            elif status == TechnicianApplicationStatus.APPROVED:
                TechnicianOnboardingService._log_activity(app, manager, "Application Approved", "Technician role granted.")
                RoleService.assign_role(user=app.user, role_slug='technician', assigned_by=manager, reason="Application Approved")
                event_publisher.publish(
                    event_name='technician.approved',
                    event_version=1,
                    correlation_id=str(app.id),
                    occurred_at=timezone.now(),
                    producer='TechnicianOnboardingService',
                    data={'user_id': str(app.user_id)}
                )
            elif status == TechnicianApplicationStatus.MORE_INFO_REQUESTED:
                TechnicianOnboardingService._log_activity(app, manager, "Requested More Info", "Awaiting user updates.")
                event_publisher.publish(
                    event_name='technician.more_info_requested',
                    event_version=1,
                    correlation_id=str(app.id),
                    occurred_at=timezone.now(),
                    producer='TechnicianOnboardingService',
                    data={'user_id': str(app.user_id)}
                )
            app.save()
            
        return app
