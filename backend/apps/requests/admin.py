from django.contrib import admin
from django.db import transaction
import uuid

from apps.requests.models.audit import Escalation, StateHistory
from apps.requests.models.assignment import Assignment
from apps.requests.models.quote import Quote
from apps.requests.models.request import Request
from apps.requests.models.verification import Verification, Evidence

class RequestAdmin(admin.ModelAdmin):
    list_display = ('public_id', 'customer', 'category', 'status', 'priority', 'created_at')
    list_filter = ('status', 'priority', 'category')
    search_fields = ('public_id', 'description')

    def save_model(self, request, obj, form, change):
        if change:
            old_obj = Request.objects.get(pk=obj.pk)
            super().save_model(request, obj, form, change)
            
            if old_obj.status != obj.status:
                correlation_id = str(uuid.uuid4())
                StateHistory.objects.create(
                    request=obj,
                    from_state=old_obj.status,
                    to_state=obj.status,
                    actor=request.user,
                    reason="Status updated via Django Admin",
                    correlation_id=correlation_id,
                )
                from apps.audit_logs.services.audit_service import log_action
                log_action(
                    action="request.updated_via_admin",
                    actor=request.user,
                    resource_type="request",
                    resource_id=str(obj.id),
                    metadata={"previous_state": old_obj.status, "new_state": obj.status}
                )
                from apps.requests.events.publishers import DomainEventPublisher
                transaction.on_commit(lambda: DomainEventPublisher.publish_request_updated(
                    request_id=obj.id,
                    correlation_id=correlation_id,
                    actor_id=request.user.id,
                    updates={"status": obj.status}
                ))
                from apps.requests.services.request_process_orchestrator import RequestProcessOrchestrator
                transaction.on_commit(lambda: RequestProcessOrchestrator.sync(obj.id))
        else:
            super().save_model(request, obj, form, change)

class QuoteAdmin(admin.ModelAdmin):
    list_display = ('id', 'request', 'status', 'amount', 'version')
    list_filter = ('status',)

    def save_model(self, request, obj, form, change):
        if change:
            old_obj = Quote.objects.get(pk=obj.pk)
            super().save_model(request, obj, form, change)
            if old_obj.status != obj.status:
                from apps.requests.services.request_process_orchestrator import RequestProcessOrchestrator
                transaction.on_commit(lambda: RequestProcessOrchestrator.sync(obj.request_id))
        else:
            super().save_model(request, obj, form, change)

class AssignmentAdmin(admin.ModelAdmin):
    list_display = ('id', 'request', 'technician', 'status')
    list_filter = ('status',)

    def save_model(self, request, obj, form, change):
        if change:
            old_obj = Assignment.objects.get(pk=obj.pk)
            super().save_model(request, obj, form, change)
            if old_obj.status != obj.status:
                from apps.requests.services.request_process_orchestrator import RequestProcessOrchestrator
                transaction.on_commit(lambda: RequestProcessOrchestrator.sync(obj.request_id))
        else:
            super().save_model(request, obj, form, change)

class VerificationAdmin(admin.ModelAdmin):
    list_display = ('id', 'request', 'status')
    list_filter = ('status',)

    def save_model(self, request, obj, form, change):
        if change:
            old_obj = Verification.objects.get(pk=obj.pk)
            super().save_model(request, obj, form, change)
            if old_obj.status != obj.status:
                from apps.requests.services.request_process_orchestrator import RequestProcessOrchestrator
                transaction.on_commit(lambda: RequestProcessOrchestrator.sync(obj.request_id))
        else:
            super().save_model(request, obj, form, change)

admin.site.register(Request, RequestAdmin)
admin.site.register(Quote, QuoteAdmin)
admin.site.register(Assignment, AssignmentAdmin)
admin.site.register(Verification, VerificationAdmin)
admin.site.register([Escalation, Evidence, StateHistory])