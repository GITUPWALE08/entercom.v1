from rest_framework import serializers

class ProductCategorySerializer(serializers.Serializer):
    id = serializers.UUIDField(read_only=True)
    name = serializers.CharField()
    slug = serializers.CharField()
    status = serializers.CharField()
    created_at = serializers.DateTimeField()
    updated_at = serializers.DateTimeField()

class ProductCategoryCreateSerializer(serializers.Serializer):
    name = serializers.CharField(required=True)
    slug = serializers.CharField(required=False)

class ProductCategoryUpdateSerializer(serializers.Serializer):
    name = serializers.CharField(required=False)
    slug = serializers.CharField(required=False)

class ProductImageSerializer(serializers.Serializer):
    id = serializers.UUIDField(read_only=True)
    image = serializers.URLField(source='image_url')
    display_order = serializers.IntegerField(source='order_index')

class ProductSerializer(serializers.Serializer):
    id = serializers.UUIDField(read_only=True)
    category = serializers.UUIDField(source='category_id')
    category_name = serializers.CharField(source='category.name', read_only=True)
    name = serializers.CharField()
    sku = serializers.CharField()
    description = serializers.CharField(allow_null=True)
    price = serializers.DecimalField(source='unit_price', max_digits=10, decimal_places=2)
    quantity_available = serializers.SerializerMethodField()
    low_stock_threshold = serializers.SerializerMethodField()
    attributes = serializers.JSONField(allow_null=True)
    status = serializers.CharField()
    images = ProductImageSerializer(many=True, read_only=True)
    created_at = serializers.DateTimeField()
    updated_at = serializers.DateTimeField()

    def get_quantity_available(self, obj):
        request = self.context.get('request')
        if request:
            from apps.products.api.views import get_actor
            from apps.products.permissions import ProductPermissionChecker
            from django.core.exceptions import PermissionDenied
            actor = get_actor(request)
            try:
                ProductPermissionChecker.check(actor, 'inventory.view')
                return obj.quantity_available
            except PermissionDenied:
                pass
        return 1 if obj.quantity_available > 0 else 0

    def get_low_stock_threshold(self, obj):
        request = self.context.get('request')
        if request:
            from apps.products.api.views import get_actor
            from apps.products.permissions import ProductPermissionChecker
            from django.core.exceptions import PermissionDenied
            actor = get_actor(request)
            try:
                ProductPermissionChecker.check(actor, 'inventory.view')
                return obj.low_stock_threshold
            except PermissionDenied:
                pass
        return None

class ProductCreateSerializer(serializers.Serializer):
    category = serializers.UUIDField(required=True)
    name = serializers.CharField(required=True)
    sku = serializers.CharField(required=True)
    price = serializers.DecimalField(required=True, max_digits=10, decimal_places=2)
    description = serializers.CharField(required=False, allow_null=True)
    quantity_available = serializers.IntegerField(required=False, default=0)
    low_stock_threshold = serializers.IntegerField(required=False, default=0)
    attributes = serializers.JSONField(required=False, allow_null=True)

class ProductUpdateSerializer(serializers.Serializer):
    category = serializers.UUIDField(required=False)
    name = serializers.CharField(required=False)
    description = serializers.CharField(required=False, allow_null=True)
    price = serializers.DecimalField(required=False, max_digits=10, decimal_places=2)
    quantity_available = serializers.IntegerField(required=False)
    low_stock_threshold = serializers.IntegerField(required=False)
    status = serializers.CharField(required=False)
    attributes = serializers.JSONField(required=False, allow_null=True)

class InventoryAdjustmentSerializer(serializers.Serializer):
    adjustment_amount = serializers.IntegerField(required=True)
    reason = serializers.CharField(required=True)
