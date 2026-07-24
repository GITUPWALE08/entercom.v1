from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from django.shortcuts import get_object_or_404
import uuid

from apps.products.services.product_service import ProductService
from apps.products.services.category_service import CategoryService
from apps.products.services.inventory_service import InventoryService
from apps.products.models import Product, ProductCategory
from django.core.exceptions import ValidationError as DjangoValidationError
from django.db import IntegrityError
from apps.products.permissions import ProductPermissionChecker
from apps.common.permissions import Actor, Role
from .serializers import (
    ProductCategorySerializer, ProductCategoryCreateSerializer, ProductCategoryUpdateSerializer,
    ProductSerializer, ProductCreateSerializer, ProductUpdateSerializer, InventoryAdjustmentSerializer
)

def get_actor(request):
    if request.user.is_authenticated:
        try:
            role = Role(request.user.role.lower())
        except ValueError:
            role = Role.CUSTOMER
        return Actor(id=request.user.id, role=role)
    return Actor(id=uuid.uuid4(), role=Role.CUSTOMER)

class CategoryListView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        ProductPermissionChecker.check(get_actor(request), 'category.view')
        categories = ProductCategory.objects.all()
        serializer = ProductCategorySerializer(categories, many=True)
        return Response(serializer.data)

    def post(self, request):
        actor = get_actor(request)
        ProductPermissionChecker.check(actor, 'category.create')
        serializer = ProductCategoryCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        category = CategoryService.create_category(
            actor=actor,
            correlation_id=str(uuid.uuid4()),
            name=serializer.validated_data['name'],
            slug=serializer.validated_data.get('slug', '')
        )
        return Response(ProductCategorySerializer(category).data, status=status.HTTP_201_CREATED)

class CategoryDetailView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request, pk):
        ProductPermissionChecker.check(get_actor(request), 'category.view')
        category = get_object_or_404(ProductCategory, pk=pk)
        return Response(ProductCategorySerializer(category).data)

    def patch(self, request, pk):
        actor = get_actor(request)
        ProductPermissionChecker.check(actor, 'category.update')
        serializer = ProductCategoryUpdateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        category = CategoryService.update_category(
            actor=actor,
            correlation_id=str(uuid.uuid4()),
            category_id=pk,
            changed_fields=serializer.validated_data
        )
        return Response(ProductCategorySerializer(category).data)

class CategoryArchiveView(APIView):
    permission_classes = [IsAuthenticated]
    
    def post(self, request, pk):
        actor = get_actor(request)
        ProductPermissionChecker.check(actor, 'category.archive')
        category = CategoryService.archive_category(
            actor=actor,
            correlation_id=str(uuid.uuid4()),
            category_id=pk
        )
        return Response(ProductCategorySerializer(category).data)

class ProductListView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        ProductPermissionChecker.check(get_actor(request), 'product.view')
        products = Product.objects.all()
        category_id = request.query_params.get('category_id')
        if category_id:
            products = products.filter(category_id=category_id)
        state = request.query_params.get('state')
        if state:
            products = products.filter(status=state)
            
        serializer = ProductSerializer(products, many=True, context={'request': request})
        return Response(serializer.data)

    def post(self, request):
        actor = get_actor(request)
        ProductPermissionChecker.check(actor, 'product.create')
        serializer = ProductCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        data = serializer.validated_data
        try:
            product = ProductService.create_product(
                actor=actor,
                correlation_id=str(uuid.uuid4()),
                category_id=data['category'],
                name=data['name'],
                unit_price=data['price'],
                quantity_available=data.get('quantity_available', 0),
                low_stock_threshold=data.get('low_stock_threshold', 0),
                sku=data['sku'],
                description=data.get('description'),
                attributes=data.get('attributes')
            )
            return Response(ProductSerializer(product, context={'request': request}).data, status=status.HTTP_201_CREATED)
        except DjangoValidationError as e:
            return error_response(e.message if hasattr(e, 'message') else str(e))
        except IntegrityError:
            return error_response("A product with this SKU already exists.")

class ProductDetailView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request, pk):
        ProductPermissionChecker.check(get_actor(request), 'product.view')
        product = get_object_or_404(Product, pk=pk)
        return Response(ProductSerializer(product, context={'request': request}).data)

    def patch(self, request, pk):
        actor = get_actor(request)
        ProductPermissionChecker.check(actor, 'product.update')
        serializer = ProductUpdateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        changed_fields = dict(serializer.validated_data)
        if 'price' in changed_fields:
            changed_fields['unit_price'] = changed_fields.pop('price')
        if 'category' in changed_fields:
            changed_fields['category_id'] = changed_fields.pop('category')
            
        threshold = changed_fields.pop('low_stock_threshold', None)
        changed_fields.pop('quantity_available', None) # Prohibit direct mutation
        
        if threshold is not None:
            ProductPermissionChecker.check(actor, 'inventory.manage')
            InventoryService.update_threshold(
                actor=actor,
                correlation_id=str(uuid.uuid4()),
                product_id=pk,
                new_threshold=threshold
            )
            
        product = ProductService.update_product(
            actor=actor,
            correlation_id=str(uuid.uuid4()),
            product_id=pk,
            changed_fields=changed_fields
        )
        return Response(ProductSerializer(product, context={'request': request}).data)

class ProductArchiveView(APIView):
    permission_classes = [IsAuthenticated]
    
    def post(self, request, pk):
        actor = get_actor(request)
        ProductPermissionChecker.check(actor, 'product.archive')
        product = ProductService.archive_product(
            actor=actor,
            correlation_id=str(uuid.uuid4()),
            product_id=pk
        )
        return Response(ProductSerializer(product, context={'request': request}).data)

class ProductInventoryAdjustView(APIView):
    permission_classes = [IsAuthenticated]
    
    def post(self, request, pk):
        actor = get_actor(request)
        ProductPermissionChecker.check(actor, 'inventory.adjust')
        serializer = InventoryAdjustmentSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        InventoryService.adjust_inventory(
            actor=actor,
            correlation_id=str(uuid.uuid4()),
            product_id=pk,
            adjustment_amount=serializer.validated_data['adjustment_amount'],
            reason=serializer.validated_data['reason']
        )
        product = get_object_or_404(Product, pk=pk)
        return Response(ProductSerializer(product, context={'request': request}).data)
