from rest_framework import serializers
from django.core.exceptions import ObjectDoesNotExist
from apps.requests.services.context_builder import RequestContextBuilder
from apps.requests.domain.state_machine import RequestStateMachine
from apps.requests.models import LifecycleState
        

class RequestListSerializer(serializers.Serializer):
    id = serializers.UUIDField()
    public_id = serializers.CharField(required=False)
    status = serializers.CharField()
    category = serializers.CharField()
    priority = serializers.CharField(required=False)
    description = serializers.CharField(required=False)
    location = serializers.JSONField(required=False)
    requires_technician = serializers.BooleanField(required=False)
    created_at = serializers.DateTimeField(required=False)
    next_states = serializers.SerializerMethodField()
    payment_id = serializers.SerializerMethodField()
    order_id = serializers.SerializerMethodField()
    order_status = serializers.SerializerMethodField()
    payment_status = serializers.SerializerMethodField()

    def get_order_id(self, obj):
        try:
            if hasattr(obj, 'order') and obj.order:
                return str(obj.order.id)
        except ObjectDoesNotExist:
            pass
        except AttributeError:
            pass
        return None

    def get_order_status(self, obj):
        from django.core.exceptions import ObjectDoesNotExist
        try:
            if hasattr(obj, 'order') and obj.order:
                return obj.order.status
        except ObjectDoesNotExist:
            pass
        except AttributeError:
            pass
        return None

    def get_payment_id(self, obj):
        if not hasattr(obj, 'payments'):
            return None
        payment = obj.payments.order_by('-created_at').first()
        return str(payment.id) if payment else None

    def get_payment_status(self, obj):
        if not hasattr(obj, 'payments'):
            return None
        payment = obj.payments.order_by('-created_at').first()
        return payment.status if payment else None

    def get_next_states(self, obj):        
        status = obj.status if hasattr(obj, 'status') else obj.get('status')
        
        machine = RequestStateMachine(status)
        transitions = machine.get_allowed_transitions()
        
        if isinstance(obj, dict):
            from apps.requests.models.request import Request
            obj = Request.objects.get(id=obj.get('id'))
            
        context = RequestContextBuilder(obj).build()
        
        user = None
        request_context = self.context.get("request")
        if request_context and hasattr(request_context, "user"):
            user = request_context.user

        user_permissions = []
        if user and hasattr(user, "role"):
            from apps.requests.permissions.matrix import PermissionRegistry, Role
            user_permissions = [p.value for p in PermissionRegistry.get_permissions_for_role(Role(user.role))]
            
        from apps.requests.domain.transitions import TriggerType
        valid_targets = []
        for t in transitions:
            if t.trigger_type != TriggerType.MANUAL:
                continue
            if t.required_permission and t.required_permission not in user_permissions:
                continue
            if t.guard is None or t.guard(context):
                valid_targets.append({"action": t.action.value, "target": t.target.value})
                
        seen = set()
        result = []
        for v in valid_targets:
            key = (v["action"], v["target"])
            if key not in seen:
                seen.add(key)
                result.append(v)
                
        return result

class QuoteListSerializer(serializers.Serializer):
    id = serializers.UUIDField()
    version = serializers.IntegerField()
    amount = serializers.DecimalField(max_digits=10, decimal_places=2)
    status = serializers.CharField()

class CreateRequestSerializer(serializers.Serializer):
    category = serializers.CharField(required=True)
    description = serializers.CharField(required=True)
    location = serializers.JSONField(required=True)
    requires_technician = serializers.BooleanField(required=False, default=False)

class UpdateRequestSerializer(serializers.Serializer):
    action = serializers.CharField(required=False)
    description = serializers.CharField(required=False)
    location = serializers.JSONField(required=False)
    status = serializers.CharField(required=False)
    # Add other fields as necessary based on domain mapping.

class AssignTechnicianSerializer(serializers.Serializer):
    technician_id = serializers.CharField(required=True)

class DeclineAssignmentSerializer(serializers.Serializer):
    reason_code = serializers.CharField(required=True)

class CancelRequestSerializer(serializers.Serializer):
    reason_code = serializers.CharField(required=True)

class CreateQuoteSerializer(serializers.Serializer):
    amount = serializers.DecimalField(max_digits=10, decimal_places=2, required=True)
    notes = serializers.CharField(required=False, allow_blank=True)

class CustomerQuoteActionSerializer(serializers.Serializer):
    action = serializers.ChoiceField(choices=['approve', 'reject', 'revise'], required=True)
    reason = serializers.CharField(required=False, allow_blank=True)

class SubmitVerificationSerializer(serializers.Serializer):
    photos = serializers.ListField(child=serializers.URLField(), required=True, allow_empty=False)
    notes = serializers.CharField(required=False, allow_blank=True)
    checklist = serializers.JSONField(required=False)
    customer_ack = serializers.BooleanField(required=False)
    metadata = serializers.JSONField(required=False)

class VerificationReviewSerializer(serializers.Serializer):
    action = serializers.ChoiceField(choices=['approve', 'reject', 'override'], required=True)
    notes = serializers.CharField(required=False, allow_blank=True)

class EscalationSerializer(serializers.Serializer):
    reason = serializers.CharField(required=True)
