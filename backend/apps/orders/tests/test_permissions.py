import pytest
from django.core.exceptions import PermissionDenied
from apps.orders.permissions import OrderPermissionChecker, OrderPermissions
from apps.common.permissions import Actor, Role
from apps.orders.models import Order
import uuid

pytestmark = pytest.mark.django_db

def test_order_permissions_edge_cases(customer_user, request_obj):
    # Create an order
    order = Order.objects.create(
        id=uuid.uuid4(),
        request=request_obj,
        customer=customer_user,
        total_amount=100
    )
    
    customer1 = Actor(id=customer_user.id, role=Role.CUSTOMER)
    customer2 = Actor(id=uuid.uuid4(), role=Role.CUSTOMER)
    
    # VIEW_OWN
    # Cannot view another customer's order
    with pytest.raises(PermissionDenied):
        OrderPermissionChecker.check(customer2, OrderPermissions.VIEW_OWN, order=order)
        
    # CANCEL
    # Cannot cancel another customer's order
    with pytest.raises(PermissionDenied):
        OrderPermissionChecker.check(customer2, OrderPermissions.CANCEL, order=order)
        
    # Unknown permission
    with pytest.raises(PermissionDenied):
        OrderPermissionChecker.check(customer1, "unknown.permission")

def test_order_models_str(customer_user, request_obj, product):
    order = Order.objects.create(
        id=uuid.uuid4(),
        request=request_obj,
        customer=customer_user,
        total_amount=100
    )
    assert str(order) == f"Order {order.id} for Request {order.request_id}"
    
    from apps.orders.models.order_item import OrderItem
    item = OrderItem.objects.create(
        order=order,
        product=product,
        quantity=2,
        product_name_snapshot="Test",
        unit_price_snapshot=50,
        line_total_snapshot=100
    )
    assert str(item) == f"{item.quantity}x {item.product_name_snapshot} (Order: {order.id})"
