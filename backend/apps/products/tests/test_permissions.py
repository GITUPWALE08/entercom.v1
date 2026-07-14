import pytest
from apps.products.models import ProductCategory, Product, ProductImage
from apps.products.permissions import ProductPermissions, CategoryPermissions, ProductPermissionChecker
from apps.common.permissions import Actor, Role
import uuid

pytestmark = pytest.mark.django_db

def test_product_models_str(category):
    assert str(category) == category.name
    
    product = Product.objects.create(
        category=category,
        name="Test",
        unit_price=10.0,
        quantity_available=5,
        sku="SKU1"
    )
    assert str(product) == product.name
    
    img = ProductImage.objects.create(product=product, image_url="http://test.com/img.jpg")
    assert str(img) == f"Image for Test - http://test.com/img.jpg"

def test_product_permissions_edge_cases():
    customer = Actor(id=uuid.uuid4(), role=Role.CUSTOMER)
    
    from django.core.exceptions import PermissionDenied
    with pytest.raises(PermissionDenied):
        ProductPermissionChecker.check(customer, "unknown.permission")
