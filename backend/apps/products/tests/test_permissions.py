import pytest
import uuid
from decimal import Decimal
from django.core.exceptions import PermissionDenied
from apps.products.services.product_service import ProductService
from apps.products.services.category_service import CategoryService
from apps.products.services.inventory_service import InventoryService
from apps.products.models.product import ProductStatus, Product
from apps.products.models.category import ProductCategory, CategoryStatus
from django.contrib.auth import get_user_model

User = get_user_model()
pytestmark = pytest.mark.django_db

# Creating a manager for test PROD-019
@pytest.fixture
def manager_user():
    return User.objects.create(email="manager@example.com", is_staff=True, password="password", role="MANAGER")

def test_test_prod_016_product_view_allowed_for_customer(customer_user):
    """
    Inventory:
        TEST-PROD-016
    Rule:
        product.view allowed for Customer
    """
    # product.view is usually tested at API/ViewSet level, 
    # but let's assert the core permission mapping allows it
    from core.permissions import require_permission
    assert require_permission(customer_user, 'product.view') is True

def test_test_prod_017_product_create_allowed_for_staff_denied_for_customer(staff_user, customer_user, category):
    """
    Inventory:
        TEST-PROD-017
    Rule:
        product.create allowed for Staff, denied for Customer
    """
    # Customer should be denied
    with pytest.raises(PermissionDenied):
        ProductService.create_product(
            actor=customer_user,
            correlation_id=str(uuid.uuid4()),
            category_id=category.id,
            name="New Prod",
            unit_price=Decimal("50.00"),
            quantity_available=10,
            low_stock_threshold=5,
            sku="SKU-CUST"
        )
        
    # Staff should be allowed
    product = ProductService.create_product(
        actor=staff_user,
        correlation_id=str(uuid.uuid4()),
        category_id=category.id,
        name="New Prod Staff",
        unit_price=Decimal("50.00"),
        quantity_available=10,
        low_stock_threshold=5,
        sku="SKU-STAFF"
    )
    assert product.name == "New Prod Staff"

def test_test_prod_018_product_update_allowed_for_staff_denied_for_customer(staff_user, customer_user, product):
    """
    Inventory:
        TEST-PROD-018
    Rule:
        product.update allowed for Staff, denied for Customer
    """
    with pytest.raises(PermissionDenied):
        ProductService.update_product(
            actor=customer_user,
            correlation_id=str(uuid.uuid4()),
            product_id=product.id,
            changed_fields={"name": "Cust update"}
        )
        
    ProductService.update_product(
        actor=staff_user,
        correlation_id=str(uuid.uuid4()),
        product_id=product.id,
        changed_fields={"name": "Staff update"}
    )
    product.refresh_from_db()
    assert product.name == "Staff update"

def test_test_prod_019_product_archive_allowed_for_manager_denied_for_staff(manager_user, staff_user, product):
    """
    Inventory:
        TEST-PROD-019
    Rule:
        product.archive allowed for Manager, denied for Staff
    """
    with pytest.raises(PermissionDenied):
        ProductService.archive_product(
            actor=staff_user,
            correlation_id=str(uuid.uuid4()),
            product_id=product.id
        )
        
    ProductService.archive_product(
        actor=manager_user,
        correlation_id=str(uuid.uuid4()),
        product_id=product.id
    )
    product.refresh_from_db()
    assert product.status == ProductStatus.ARCHIVED

def test_test_prod_020_category_create_allowed_for_staff_denied_for_customer(staff_user, customer_user):
    """
    Inventory:
        TEST-PROD-020
    Rule:
        category.create allowed for Staff, denied for Customer
    """
    with pytest.raises(PermissionDenied):
        CategoryService.create_category(
            actor=customer_user,
            correlation_id=str(uuid.uuid4()),
            name="Cust Cat",
            slug="cust-cat"
        )
        
    cat = CategoryService.create_category(
        actor=staff_user,
        correlation_id=str(uuid.uuid4()),
        name="Staff Cat",
        slug="staff-cat"
    )
    assert cat.name == "Staff Cat"

def test_test_prod_021_inventory_view_allowed_for_staff_denied_for_customer(staff_user, customer_user):
    """
    Inventory:
        TEST-PROD-021
    Rule:
        inventory.view allowed for Staff, denied for Customer
    """
    from core.permissions import require_permission
    assert require_permission(staff_user, 'inventory.view') is True
    
    with pytest.raises(PermissionDenied):
        require_permission(customer_user, 'inventory.view')

def test_test_prod_022_inventory_adjust_allowed_for_manager_denied_for_staff(manager_user, staff_user, product):
    """
    Inventory:
        TEST-PROD-022
    Rule:
        inventory.adjust allowed for Manager, denied for Staff
    Note: The original stub said Staff, but product-permission-mapping.md says Manager/Superadmin.
    """
    with pytest.raises(PermissionDenied):
        InventoryService.adjust_inventory(
            actor=staff_user,
            correlation_id=str(uuid.uuid4()),
            product_id=product.id,
            adjustment_amount=10,
            reason="denied"
        )
        
    InventoryService.adjust_inventory(
        actor=manager_user,
        correlation_id=str(uuid.uuid4()),
        product_id=product.id,
        adjustment_amount=10,
        reason="allowed"
    )
    product.refresh_from_db()
    assert product.quantity_available == 60 # 50 + 10
