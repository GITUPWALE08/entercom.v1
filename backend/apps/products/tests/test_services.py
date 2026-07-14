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

def test_category_service_edge_cases(staff_user):
    from apps.common.permissions import Actor, Role
    import uuid
    staff_actor = Actor(id=staff_user.id, role=Role.STAFF)
    
    # 1. create_category with duplicate slug
    CategoryService.create_category(actor=staff_actor, correlation_id=str(uuid.uuid4()), name="Test", slug="test-slug")
    with pytest.raises(ValidationError, match="slug must be unique"):
        CategoryService.create_category(actor=staff_actor, correlation_id=str(uuid.uuid4()), name="Test2", slug="test-slug")
        
    # 2. update_category not found
    with pytest.raises(ValidationError, match="Category not found"):
        CategoryService.update_category(actor=staff_actor, correlation_id=str(uuid.uuid4()), category_id=uuid.uuid4(), changed_fields={"name": "foo"})
        
    # 3. archive_category not found
    with pytest.raises(ValidationError, match="Category not found"):
        CategoryService.archive_category(actor=staff_actor, correlation_id=str(uuid.uuid4()), category_id=uuid.uuid4())
        
    # 4. archive_category already archived
    cat2 = CategoryService.create_category(actor=staff_actor, correlation_id=str(uuid.uuid4()), name="Cat2", slug="cat-2")
    CategoryService.archive_category(actor=staff_actor, correlation_id=str(uuid.uuid4()), category_id=cat2.id)
    ret = CategoryService.archive_category(actor=staff_actor, correlation_id=str(uuid.uuid4()), category_id=cat2.id)
    assert ret.id == cat2.id

def test_product_service_edge_cases(staff_user, category):
    from apps.common.permissions import Actor, Role
    import uuid
    staff_actor = Actor(id=staff_user.id, role=Role.STAFF)
    
    # 1. create_product > 4 images
    with pytest.raises(ValidationError, match="maximum of 4 images"):
        ProductService.create_product(
            actor=staff_actor, correlation_id=str(uuid.uuid4()), category_id=category.id,
            name="Prod", unit_price=10, quantity_available=10, low_stock_threshold=2, sku="P1",
            images=["1.jpg", "2.jpg", "3.jpg", "4.jpg", "5.jpg"]
        )
    
    # 2. update_product not found
    with pytest.raises(ValidationError, match="Product not found"):
        ProductService.update_product(actor=staff_actor, correlation_id=str(uuid.uuid4()), product_id=uuid.uuid4(), changed_fields={"name": "foo"})
        
    # 3. update_product with > 4 images
    prod = ProductService.create_product(
        actor=staff_actor, correlation_id=str(uuid.uuid4()), category_id=category.id,
        name="Prod", unit_price=10, quantity_available=10, low_stock_threshold=2, sku="P1"
    )
    with pytest.raises(ValidationError, match="maximum of 4 images"):
        ProductService.update_product(actor=staff_actor, correlation_id=str(uuid.uuid4()), product_id=prod.id, changed_fields={"images": ["1.jpg", "2.jpg", "3.jpg", "4.jpg", "5.jpg"]})

    # 4. archive_product not found
    with pytest.raises(ValidationError, match="Product not found"):
        ProductService.archive_product(actor=staff_actor, correlation_id=str(uuid.uuid4()), product_id=uuid.uuid4())

def test_inventory_service_edge_cases(staff_user, product):
    from apps.common.permissions import Actor, Role
    import uuid
    staff_actor = Actor(id=staff_user.id, role=Role.STAFF)
    
    # 1. reduce_inventory product not found
    with pytest.raises(ValidationError, match="not found"):
        InventoryService.reduce_inventory(actor=staff_actor, correlation_id=str(uuid.uuid4()), order_id=uuid.uuid4(), reductions=[{"product_id": uuid.uuid4(), "quantity": 1}])
        
    # 2. adjust_inventory product not found
    with pytest.raises(ValidationError, match="Product not found"):
        InventoryService.adjust_inventory(actor=staff_actor, correlation_id=str(uuid.uuid4()), product_id=uuid.uuid4(), adjustment_amount=1, reason="Test")
        
    # 3. adjust_inventory resulting in low stock
    product.quantity_available = 10
    product.low_stock_threshold = 5
    product.save()
    InventoryService.adjust_inventory(actor=staff_actor, correlation_id=str(uuid.uuid4()), product_id=product.id, adjustment_amount=-6, reason="Test")
    product.refresh_from_db()
    assert product.quantity_available == 4
    
    # 4. update_threshold product not found
    with pytest.raises(ValidationError, match="Product not found"):
        InventoryService.update_threshold(actor=staff_actor, correlation_id=str(uuid.uuid4()), product_id=uuid.uuid4(), new_threshold=5)


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
