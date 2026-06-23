import pytest
from django.core.exceptions import ValidationError
from decimal import Decimal
import uuid

from apps.products.services.product_service import ProductService
from apps.products.services.category_service import CategoryService
from apps.products.services.inventory_service import InventoryService
from apps.products.models.product import ProductStatus, Product
from apps.products.models.category import ProductCategory, CategoryStatus

pytestmark = pytest.mark.django_db

def test_test_prod_007_create_product(category, staff_user):
    """
    Inventory:
        TEST-PROD-007
    Rule:
        Create product
    """
    product = ProductService.create_product(
        actor=staff_user,
        correlation_id=str(uuid.uuid4()),
        category_id=category.id,
        name="New Prod",
        unit_price=Decimal("50.00"),
        quantity_available=10,
        low_stock_threshold=5,
        sku="SKU-12345",
        description="Desc",
        attributes={"key": "val"}
    )
    
    assert product.name == "New Prod"
    assert product.unit_price == Decimal("50.00")
    assert product.quantity_available == 10
    
    with pytest.raises(Exception):
        ProductService.create_product(
            actor=staff_user,
            correlation_id=str(uuid.uuid4()),
            category_id=uuid.uuid4(),  # non-existent
            name="Bad",
            unit_price=Decimal("-10.00"),
            quantity_available=10,
            low_stock_threshold=5,
            sku="SKU-123456"
        )


def test_test_prod_008_update_product(product, staff_user):
    """
    Inventory:
        TEST-PROD-008
    Rule:
        Update product
    """
    updated_product = ProductService.update_product(
        actor=staff_user,
        correlation_id=str(uuid.uuid4()),
        product_id=product.id,
        changed_fields={
            "name": "Updated Name",
            "unit_price": Decimal("150.00")
        }
    )
    
    assert updated_product.name == "Updated Name"
    assert updated_product.unit_price == Decimal("150.00")


def test_test_prod_009_archive_product(product, admin_user):
    """
    Inventory:
        TEST-PROD-009
    Rule:
        Archive product
    """
    ProductService.archive_product(
        actor=admin_user,
        correlation_id=str(uuid.uuid4()),
        product_id=product.id
    )
    
    product.refresh_from_db()
    assert product.status == ProductStatus.ARCHIVED


def test_test_prod_010_create_category(staff_user):
    """
    Inventory:
        TEST-PROD-010
    Rule:
        Create category
    """
    cat = CategoryService.create_category(
        actor=staff_user,
        correlation_id=str(uuid.uuid4()),
        name="New Category",
        slug="new-cat"
    )
    
    assert cat.name == "New Category"
    
    with pytest.raises(Exception):
        CategoryService.create_category(
            actor=staff_user,
            correlation_id=str(uuid.uuid4()),
            name="Dup",
            slug="new-cat" # dup slug
        )


def test_test_prod_011_update_category(category, staff_user):
    """
    Inventory:
        TEST-PROD-011
    Rule:
        Update category
    """
    updated_cat = CategoryService.update_category(
        actor=staff_user,
        correlation_id=str(uuid.uuid4()),
        category_id=category.id,
        changed_fields={"name": "Updated Cat"}
    )
    
    assert updated_cat.name == "Updated Cat"


def test_test_prod_012_archive_category(category, admin_user):
    """
    Inventory:
        TEST-PROD-012
    Rule:
        Archive category
    """
    CategoryService.archive_category(
        actor=admin_user,
        correlation_id=str(uuid.uuid4()),
        category_id=category.id
    )
    
    category.refresh_from_db()
    assert category.status == CategoryStatus.ARCHIVED


def test_test_prod_013_inventory_reduction(product, staff_user):
    """
    Inventory:
        TEST-PROD-013
    Rule:
        Inventory reduction
    """
    initial_qty = product.quantity_available
    
    InventoryService.reduce_inventory(
        actor=staff_user,
        correlation_id=str(uuid.uuid4()),
        order_id=uuid.uuid4(),
        reductions=[
            {"product_id": product.id, "quantity": 5}
        ]
    )
    
    product.refresh_from_db()
    assert product.quantity_available == initial_qty - 5
    
    with pytest.raises(ValidationError):
        InventoryService.reduce_inventory(
            actor=staff_user,
            correlation_id=str(uuid.uuid4()),
            order_id=uuid.uuid4(),
            reductions=[
                {"product_id": product.id, "quantity": initial_qty + 10}
            ]
        )


def test_test_prod_014_inventory_adjustment(product, admin_user):
    """
    Inventory:
        TEST-PROD-014
    Rule:
        Inventory adjustment
    """
    initial_qty = product.quantity_available
    adjustment = 20

    InventoryService.adjust_inventory(
        actor=admin_user,
        correlation_id=str(uuid.uuid4()),
        product_id=product.id,
        adjustment_amount=adjustment,
        reason="Manual adjustment"
    )
    
    product.refresh_from_db()
    assert product.quantity_available == initial_qty + adjustment
    
    with pytest.raises(ValidationError):
        # adjustment_amount causing negative inventory
        InventoryService.adjust_inventory(
            actor=admin_user,
            correlation_id=str(uuid.uuid4()),
            product_id=product.id,
            adjustment_amount=-(initial_qty + adjustment + 10),
            reason="Invalid"
        )


def test_test_prod_015_low_stock_detection(product, admin_user):
    """
    Inventory:
        TEST-PROD-015
    Rule:
        Low stock detection
    """
    product.low_stock_threshold = 10
    product.quantity_available = 15
    product.save()
    
    InventoryService.reduce_inventory(
        actor=admin_user,
        correlation_id=str(uuid.uuid4()),
        order_id=uuid.uuid4(),
        reductions=[
            {"product_id": product.id, "quantity": 10}
        ]
    )
    
    product.refresh_from_db()
    assert product.quantity_available == 5
