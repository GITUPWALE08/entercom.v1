from rest_framework import serializers


class AuditLogFilterSerializer(serializers.Serializer):
    action = serializers.CharField(required=False, allow_blank=True)
    actor_email = serializers.CharField(required=False, allow_blank=True)
    resource_type = serializers.CharField(required=False, allow_blank=True)
    request_id = serializers.CharField(required=False, allow_blank=True)
    correlation_id = serializers.CharField(required=False, allow_blank=True)
    date_from = serializers.DateTimeField(required=False)
    date_to = serializers.DateTimeField(required=False)
