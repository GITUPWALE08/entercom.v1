import pytest
from django.core.exceptions import PermissionDenied
from apps.common.permissions import Actor, Role
from apps.orders.permissions import OrderPermissionChecker, OrderPermissions
from apps.orders.models import Order, OrderStatus

pytestmark = pytest.mark.django_db

@pytest.fixture
def customer_actor(customer_user):
    return Actor(id=customer_user.id, role=Role.CUSTOMER)

@pytest.fixture
def staff_actor(staff_user):
    return Actor(id=staff_user.id, role=Role.STAFF)

@pytest.fixture
def manager_actor(manager_user):
    return Actor(id=manager_user.id, role=Role.MANAGER)

def test_test_ord_011_order_create_allowed_for_customer(customer_actor):
    """
    Inventory:
        TEST-ORD-011
    Rule:
        order.create allowed for Customer
    """
    assert OrderPermissionChecker.check(customer_actor, OrderPermissions.CREATE) is True

def test_test_ord_012_order_view_own_idor_protection(customer_actor, customer_user, request_obj):
    """
    Inventory:
        TEST-ORD-012
    Rule:
        order.view_own IDOR protection
    """
    order = Order.objects.create(request=request_obj, customer=customer_user, total_amount=100)
    
    assert OrderPermissionChecker.check(customer_actor, OrderPermissions.VIEW_OWN, order=order) is True
    
    other_customer_actor = Actor(id='some-other-id', role=Role.CUSTOMER)
    with pytest.raises(PermissionDenied):
        OrderPermissionChecker.check(other_customer_actor, OrderPermissions.VIEW_OWN, order=order)

def test_test_ord_013_order_view_allowed_for_staff_denied_for_customer(staff_actor, customer_actor):
    """
    Inventory:
        TEST-ORD-013
    Rule:
        order.view allowed for Staff, denied for Customer
    """
    assert OrderPermissionChecker.check(staff_actor, OrderPermissions.VIEW) is True
    with pytest.raises(PermissionDenied):
        OrderPermissionChecker.check(customer_actor, OrderPermissions.VIEW)

def test_test_ord_014_order_cancel_allowed_for_pending_denied_for_paid(staff_actor, customer_user, request_obj):
    """
    Inventory:
        TEST-ORD-014
    Rule:
        order.cancel allowed for pending, denied for paid
    """
    from apps.orders.services.order_service import OrderService
    import uuid
    from django.core.exceptions import ValidationError
    
    order = Order.objects.create(request=request_obj, customer=customer_user, status=OrderStatus.PENDING_PAYMENT, total_amount=100)
    
    OrderService.cancel_order(staff_actor, str(uuid.uuid4()), order.id, "reason")
    order.refresh_from_db()
    assert order.status == OrderStatus.CANCELLED
    
    order.status = OrderStatus.PAID
    order.save()
    
    with pytest.raises(ValidationError):
        OrderService.cancel_order(staff_actor, str(uuid.uuid4()), order.id, "reason")

def test_test_ord_015_order_fulfill_allowed_for_staff_denied_for_customer(staff_actor, customer_actor):
    """
    Inventory:
        TEST-ORD-015
    Rule:
        order.fulfill allowed for Staff, denied for Customer
    """
    assert OrderPermissionChecker.check(staff_actor, OrderPermissions.FULFILL) is True
    with pytest.raises(PermissionDenied):
        OrderPermissionChecker.check(customer_actor, OrderPermissions.FULFILL)

def test_test_ord_016_order_override_fulfillment_manager_only(staff_actor, manager_actor):
    """
    Inventory:
        TEST-ORD-016
    Rule:
        order.override_fulfillment Manager only
    """
    assert OrderPermissionChecker.check(manager_actor, OrderPermissions.OVERRIDE_FULFILLMENT) is True
    with pytest.raises(PermissionDenied):
        OrderPermissionChecker.check(staff_actor, OrderPermissions.OVERRIDE_FULFILLMENT)

