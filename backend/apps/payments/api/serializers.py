from rest_framework import serializers

class PaymentSerializer(serializers.Serializer):
    id = serializers.UUIDField(read_only=True)
    order_id = serializers.UUIDField()
    status = serializers.CharField()
    amount = serializers.DecimalField(max_digits=12, decimal_places=2)
    currency = serializers.CharField()
    provider_reference = serializers.CharField()
    authorization_url = serializers.CharField(required=False, read_only=True)
    created_at = serializers.DateTimeField()
    updated_at = serializers.DateTimeField()

class PaymentInitializeSerializer(serializers.Serializer):
    order_id = serializers.UUIDField(required=True)

class PaymentCancelSerializer(serializers.Serializer):
    reason = serializers.CharField(required=True)

class PaymentRefundSerializer(serializers.Serializer):
    reason = serializers.CharField(required=False, allow_blank=True)

class PaymentEscalateSerializer(serializers.Serializer):
    reason = serializers.CharField(required=True)
