import pytest
import uuid
from decimal import Decimal
from django.contrib.auth import get_user_model
from apps.products.models.category import ProductCategory
from apps.products.models.product import Product, ProductStatus

User = get_user_model()

@pytest.fixture
def admin_user():
    return User.objects.create(email="admin@example.com", is_staff=True, is_superuser=True, password="password", role="SUPER_ADMIN")

@pytest.fixture
def manager_user():
    return User.objects.create(email="manager@example.com", is_staff=True, password="password", role="MANAGER")

@pytest.fixture
def staff_user():
    return User.objects.create(email="staff@example.com", is_staff=True, password="password", role="STAFF")

@pytest.fixture
def customer_user():
    return User.objects.create(email="customer@example.com", is_staff=False, password="password", role="CUSTOMER")

@pytest.fixture
def category():
    return ProductCategory.objects.create(name="Test Category", slug=f"test-cat-{uuid.uuid4().hex[:6]}")

@pytest.fixture
def product(category):
    return Product.objects.create(
        category=category,
        name="Test Product",
        sku=f"SKU-{uuid.uuid4().hex[:6]}",
        unit_price=Decimal("100.00"),
        quantity_available=50,
        low_stock_threshold=10,
        status=ProductStatus.ACTIVE
    )
