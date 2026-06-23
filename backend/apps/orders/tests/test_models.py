import pytest
from django.db import IntegrityError
from django.core.exceptions import ValidationError
from apps.orders.models import Order, OrderItem

pytestmark = pytest.mark.django_db

def test_test_ord_001_one_request__one_order(customer_user, request_obj):
    """
    Inventory:
        TEST-ORD-001
    Rule:
        One Request -> One Order
    """
    Order.objects.create(request=request_obj, customer=customer_user, total_amount=100)
    
    with pytest.raises(IntegrityError):
        Order.objects.create(request=request_obj, customer=customer_user, total_amount=50)

def test_test_ord_002_order_totals_calculation(customer_user, request_obj):
    """
    Inventory:
        TEST-ORD-002
    Rule:
        Order totals calculation (check constraint total_amount >= 0)
    """
    order = Order(request=request_obj, customer=customer_user, total_amount=-10)
    with pytest.raises(ValidationError):
        order.full_clean()

def test_test_ord_003_orderitem_snapshot_price_persistence(customer_user, request_obj, product):
    """
    Inventory:
        TEST-ORD-003
    Rule:
        OrderItem snapshot price persistence
    """
    order = Order.objects.create(request=request_obj, customer=customer_user, total_amount=100)
    item = OrderItem.objects.create(
        order=order,
        product=product,
        quantity=2,
        product_name_snapshot=product.name,
        unit_price_snapshot=product.unit_price,
        line_total_snapshot=product.unit_price * 2
    )
    
    # Change product price
    product.unit_price = 200
    product.save()
    
    # Refresh item
    item.refresh_from_db()
    assert item.unit_price_snapshot == 100
    assert item.unit_price_snapshot != product.unit_price

def test_test_ord_004_orderitem_positive_quantity_constraint(customer_user, request_obj, product):
    """
    Inventory:
        TEST-ORD-004
    Rule:
        OrderItem positive quantity constraint
    """
    order = Order.objects.create(request=request_obj, customer=customer_user, total_amount=100)
    item = OrderItem(
        order=order,
        product=product,
        quantity=0,
        product_name_snapshot=product.name,
        unit_price_snapshot=product.unit_price,
        line_total_snapshot=0
    )
    with pytest.raises(ValidationError):
        item.full_clean()

