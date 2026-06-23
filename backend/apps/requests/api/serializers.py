from rest_framework import serializers

class RequestListSerializer(serializers.Serializer):
    id = serializers.UUIDField()
    public_id = serializers.CharField(required=False)
    status = serializers.CharField()
    category = serializers.CharField()
    priority = serializers.CharField(required=False)

class QuoteListSerializer(serializers.Serializer):
    id = serializers.UUIDField()
    version = serializers.IntegerField()
    amount = serializers.DecimalField(max_digits=10, decimal_places=2)
    status = serializers.CharField()

class CreateRequestSerializer(serializers.Serializer):
    category = serializers.CharField(required=True)
    description = serializers.CharField(required=True)
    location = serializers.JSONField(required=True)

class UpdateRequestSerializer(serializers.Serializer):
    description = serializers.CharField(required=False)
    location = serializers.JSONField(required=False)
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
