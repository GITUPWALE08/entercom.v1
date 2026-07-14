import pytest
import uuid
from unittest.mock import patch
from django.core.exceptions import ValidationError
from apps.orders.services.order_service import OrderService
from apps.orders.models import Order, OrderStatus
from apps.common.permissions import Actor, Role
from apps.products.models.product import ProductStatus

pytestmark = pytest.mark.django_db

@pytest.fixture
def customer_actor(customer_user):
    return Actor(id=customer_user.id, role=Role.CUSTOMER)

@pytest.fixture
def staff_actor(staff_user):
    return Actor(id=staff_user.id, role=Role.STAFF)

def test_test_ord_005_create_order(customer_actor, customer_user, request_obj, product):
    """
    Inventory:
        TEST-ORD-005
    Rule:
        Create order
    """
    items_data = [{'product_id': product.id, 'quantity': 2}]
    
    order = OrderService.create_order(
        actor=customer_actor,
        correlation_id=str(uuid.uuid4()),
        request_id=request_obj.id,
        customer_id=customer_user.id,
        items_data=items_data
    )
    
    assert order.status == OrderStatus.CREATED
    assert order.total_amount == product.unit_price * 2
    assert order.items.count() == 1
    assert order.items.first().product_id == product.id

def test_test_ord_006_cancel_order(customer_actor, customer_user, request_obj, product):
    """
    Inventory:
        TEST-ORD-006
    Rule:
        Cancel order
    """
    items_data = [{'product_id': product.id, 'quantity': 1}]
    order = OrderService.create_order(
        actor=customer_actor,
        correlation_id=str(uuid.uuid4()),
        request_id=request_obj.id,
        customer_id=customer_user.id,
        items_data=items_data
    )
    
    OrderService.cancel_order(
        actor=customer_actor,
        correlation_id=str(uuid.uuid4()),
        order_id=order.id,
        cancellation_reason="No longer needed"
    )
    
    order.refresh_from_db()
    assert order.status == OrderStatus.CANCELLED

def test_test_ord_007_fulfill_order(customer_actor, staff_actor, customer_user, request_obj, product):
    """
    Inventory:
        TEST-ORD-007
    Rule:
        Fulfill order
    """
    items_data = [{'product_id': product.id, 'quantity': 1}]
    order = OrderService.create_order(
        actor=customer_actor,
        correlation_id=str(uuid.uuid4()),
        request_id=request_obj.id,
        customer_id=customer_user.id,
        items_data=items_data
    )
    
    # Must be PAID before fulfillment
    with pytest.raises(ValidationError):
        OrderService.fulfill_order(actor=staff_actor, correlation_id=str(uuid.uuid4()), order_id=order.id)
        
    order.status = OrderStatus.PAID
    order.save()
    
    OrderService.fulfill_order(actor=staff_actor, correlation_id=str(uuid.uuid4()), order_id=order.id)
    order.refresh_from_db()
    assert order.status == OrderStatus.FULFILLED

def test_test_ord_008_payment_required_transition(customer_actor, customer_user, request_obj, product):
    """
    Inventory:
        TEST-ORD-008
    Rule:
        Payment-required transition
    """
    items_data = [{'product_id': product.id, 'quantity': 1}]
    order = OrderService.create_order(
        actor=customer_actor,
        correlation_id=str(uuid.uuid4()),
        request_id=request_obj.id,
        customer_id=customer_user.id,
        items_data=items_data
    )
    
    OrderService.require_payment(
        actor=customer_actor,
        correlation_id=str(uuid.uuid4()),
        order_id=order.id,
        payment_id=str(uuid.uuid4()),
        amount=order.total_amount
    )
    
    order.refresh_from_db()
    assert order.status == OrderStatus.PENDING_PAYMENT

@patch('apps.orders.services.order_service.InventoryService')
def test_test_ord_009_inventory_reduction_trigger(mock_inventory_service, customer_actor, customer_user, request_obj, product):
    """
    Inventory:
        TEST-ORD-009
    Rule:
        Inventory reduction trigger
    """
    items_data = [{'product_id': product.id, 'quantity': 2}]
    order = OrderService.create_order(
        actor=customer_actor,
        correlation_id=str(uuid.uuid4()),
        request_id=request_obj.id,
        customer_id=customer_user.id,
        items_data=items_data
    )
    
    OrderService.require_payment(
        actor=customer_actor,
        correlation_id=str(uuid.uuid4()),
        order_id=order.id,
        payment_id=str(uuid.uuid4()),
        amount=order.total_amount
    )
    
    OrderService.process_payment_paid_event(
        actor=customer_actor,
        correlation_id=str(uuid.uuid4()),
        order_id=order.id
    )
    
    order.refresh_from_db()
    assert order.status == OrderStatus.PAID
    mock_inventory_service.reduce_inventory.assert_called_once()
    args, kwargs = mock_inventory_service.reduce_inventory.call_args
    assert kwargs.get('reductions') is None  # It's passed as args: reduce_inventory(actor, corr_id, order_id, reductions)
    reductions = args[3]
    assert len(reductions) == 1
    assert reductions[0]['product_id'] == str(product.id)
    assert reductions[0]['quantity'] == 2

def test_test_ord_010_archived_product_rejection(customer_actor, customer_user, request_obj, product):
    """
    Inventory:
        TEST-ORD-010
    Rule:
        Archived product rejection
    """
    product.status = ProductStatus.ARCHIVED
    product.save()
    
    items_data = [{'product_id': product.id, 'quantity': 1}]
    
    with pytest.raises(ValidationError, match="is archived"):
        OrderService.create_order(
            actor=customer_actor,
            correlation_id=str(uuid.uuid4()),
            request_id=request_obj.id,
            customer_id=customer_user.id,
            items_data=items_data
        )

def test_order_service_edge_cases(customer_actor, staff_actor, customer_user, request_obj, product):
    # 1. create_order when order already exists
    items_data = [{'product_id': product.id, 'quantity': 1}]
    order = OrderService.create_order(
        actor=customer_actor,
        correlation_id=str(uuid.uuid4()),
        request_id=request_obj.id,
        customer_id=customer_user.id,
        items_data=items_data
    )
    with pytest.raises(ValidationError, match="already exists"):
        OrderService.create_order(
            actor=customer_actor,
            correlation_id=str(uuid.uuid4()),
            request_id=request_obj.id, # same request id
            customer_id=customer_user.id,
            items_data=items_data
        )

    # 2. create_order with missing product
    from apps.requests.models import Request as Req
    new_req = Req.objects.create(id=uuid.uuid4(), customer=customer_user, category="other")
    with pytest.raises(ValidationError, match="not found"):
        OrderService.create_order(
            actor=customer_actor,
            correlation_id=str(uuid.uuid4()),
            request_id=new_req.id,
            customer_id=customer_user.id,
            items_data=[{'product_id': uuid.uuid4(), 'quantity': 1}]
        )
        
    # 3. create_order with quantity 0
    with pytest.raises(ValidationError, match="greater than zero"):
        OrderService.create_order(
            actor=customer_actor,
            correlation_id=str(uuid.uuid4()),
            request_id=new_req.id,
            customer_id=customer_user.id,
            items_data=[{'product_id': product.id, 'quantity': 0}]
        )

    # 4. require_payment when order not found
    with pytest.raises(ValidationError, match="Order not found"):
        OrderService.require_payment(
            actor=customer_actor,
            correlation_id=str(uuid.uuid4()),
            order_id=uuid.uuid4(),
            payment_id=str(uuid.uuid4()),
            amount=10
        )

    # 5. process_payment_paid_event when order not found
    with pytest.raises(ValidationError, match="Order not found"):
        OrderService.process_payment_paid_event(
            actor=customer_actor,
            correlation_id=str(uuid.uuid4()),
            order_id=uuid.uuid4()
        )

    # 6. process_payment_paid_event when order not payable (CANCELLED)
    order.status = OrderStatus.CANCELLED
    order.save()
    with pytest.raises(ValidationError, match="not in a payable state"):
        OrderService.process_payment_paid_event(
            actor=customer_actor,
            correlation_id=str(uuid.uuid4()),
            order_id=order.id
        )

    # 7. cancel_order when order not found
    with pytest.raises(ValidationError, match="Order not found"):
        OrderService.cancel_order(
            actor=customer_actor,
            correlation_id=str(uuid.uuid4()),
            order_id=uuid.uuid4(),
            cancellation_reason="foo"
        )
        
    # 8. cancel_order when paid
    order.status = OrderStatus.PAID
    order.save()
    with pytest.raises(ValidationError, match="Paid orders cannot be cancelled"):
        OrderService.cancel_order(
            actor=customer_actor,
            correlation_id=str(uuid.uuid4()),
            order_id=order.id,
            cancellation_reason="foo"
        )
        
    # 9. fulfill_order when order not found
    with pytest.raises(ValidationError, match="Order not found"):
        OrderService.fulfill_order(
            actor=staff_actor,
            correlation_id=str(uuid.uuid4()),
            order_id=uuid.uuid4()
        )
        
    # 10. fulfill_order when already fulfilled
    order.status = OrderStatus.FULFILLED
    order.save()
    ret = OrderService.fulfill_order(
        actor=staff_actor,
        correlation_id=str(uuid.uuid4()),
        order_id=order.id
    )
    assert ret.id == order.id

