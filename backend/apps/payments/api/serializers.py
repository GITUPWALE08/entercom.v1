from rest_framework import serializers

class PaymentSerializer(serializers.Serializer):
    id = serializers.UUIDField(read_only=True)
    order_id = serializers.UUIDField()
    status = serializers.CharField()
    amount = serializers.DecimalField(max_digits=10, decimal_places=2)
    currency = serializers.CharField()
    paystack_reference = serializers.CharField()
    expires_at = serializers.DateTimeField(read_only=True)
    created_at = serializers.DateTimeField()
    updated_at = serializers.DateTimeField()

class PaymentInitializeSerializer(serializers.Serializer):
    order_id = serializers.UUIDField(required=True)

class PaymentCancelSerializer(serializers.Serializer):
    reason = serializers.CharField(required=True)
