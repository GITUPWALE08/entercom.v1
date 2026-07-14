from rest_framework import serializers

class OrderItemSerializer(serializers.Serializer):
    product_id = serializers.UUIDField()
    product_name = serializers.CharField(source='product_name_snapshot')
    quantity = serializers.IntegerField()
    unit_price = serializers.DecimalField(source='unit_price_snapshot', max_digits=10, decimal_places=2)
    line_total = serializers.DecimalField(source='line_total_snapshot', max_digits=10, decimal_places=2)

class OrderSerializer(serializers.Serializer):
    id = serializers.UUIDField(read_only=True)
    request_id = serializers.UUIDField()
    customer_id = serializers.UUIDField()
    status = serializers.CharField()
    total_amount = serializers.DecimalField(max_digits=10, decimal_places=2)
    items = OrderItemSerializer(many=True, read_only=True)
    created_at = serializers.DateTimeField()
    updated_at = serializers.DateTimeField()

class OrderItemCreateSerializer(serializers.Serializer):
    product_id = serializers.UUIDField(required=True)
    quantity = serializers.IntegerField(required=True, min_value=1)

class OrderCreateSerializer(serializers.Serializer):
    request_id = serializers.UUIDField(required=False, allow_null=True)
    requires_technician = serializers.BooleanField(required=False, default=False)
    items = OrderItemCreateSerializer(many=True, allow_empty=False)

class OrderCancelSerializer(serializers.Serializer):
    reason = serializers.CharField(required=True)
