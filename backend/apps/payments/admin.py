from django.contrib import admin
from django.db import transaction
import uuid

from apps.payments.models.payment import Payment

class PaymentAdmin(admin.ModelAdmin):
    list_display = ('id', 'provider_reference', 'customer', 'amount', 'status', 'created_at')
    list_filter = ('status', 'currency')
    search_fields = ('provider_reference', 'customer__email')

    def save_model(self, request, obj, form, change):
        if change:
            old_obj = Payment.objects.get(pk=obj.pk)
            super().save_model(request, obj, form, change)
            
            if old_obj.status != obj.status:
                from apps.audit_logs.services.audit_service import log_action
                log_action(
                    action="payment.updated_via_admin",
                    actor=request.user,
                    resource_type="payment",
                    resource_id=str(obj.id),
                    metadata={"previous_state": old_obj.status, "new_state": obj.status}
                )
                from apps.payments.events.publishers import PaymentEventPublisher
                correlation_id = str(uuid.uuid4())
                
                if obj.status == 'successful' or obj.status == 'paid':
                    transaction.on_commit(lambda: PaymentEventPublisher.publish_payment_successful(
                        payment_id=obj.id,
                        correlation_id=correlation_id,
                        customer_id=obj.customer_id,
                        amount=obj.amount,
                        reference=obj.provider_reference
                    ))
                elif obj.status == 'failed':
                    transaction.on_commit(lambda: PaymentEventPublisher.publish_payment_failed(
                        payment_id=obj.id,
                        correlation_id=correlation_id,
                        customer_id=obj.customer_id,
                        amount=obj.amount,
                        reference=obj.provider_reference,
                        reason="Failed via Admin"
                    ))
        else:
            super().save_model(request, obj, form, change)

admin.site.register(Payment, PaymentAdmin)