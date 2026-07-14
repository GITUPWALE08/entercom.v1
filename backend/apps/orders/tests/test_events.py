import pytest
import uuid
from unittest.mock import patch
from apps.orders.services.order_service import OrderService
from apps.orders.models import OrderStatus
from apps.common.permissions import Actor, Role

pytestmark = pytest.mark.django_db

@pytest.fixture
def customer_actor(customer_user):
    return Actor(id=customer_user.id, role=Role.CUSTOMER)

@patch('apps.orders.services.order_service.event_publisher')
def test_test_ord_022_order_created_event_emission(mock_publisher, customer_actor, customer_user, request_obj, product):
    """
    Inventory:
        TEST-ORD-022
    Rule:
        order.created event emission
    """
    items_data = [{'product_id': product.id, 'quantity': 1}]
    corr_id = str(uuid.uuid4())
    order = OrderService.create_order(
        actor=customer_actor,
        correlation_id=corr_id,
        request_id=request_obj.id,
        customer_id=customer_user.id,
        items_data=items_data
    )
    
    mock_publisher.publish.assert_called_once()
    args, kwargs = mock_publisher.publish.call_args
    assert kwargs['event_name'] == 'order.created'
    assert kwargs['correlation_id'] == corr_id
    assert kwargs['data']['order_id'] == str(order.id)
    assert kwargs['data']['total_amount'] == float(order.total_amount)

@patch('apps.orders.services.order_service.event_publisher')
def test_test_ord_023_order_cancelled_event_emission(mock_publisher, customer_actor, customer_user, request_obj, product):
    """
    Inventory:
        TEST-ORD-023
    Rule:
        order.cancelled event emission
    """
    items_data = [{'product_id': product.id, 'quantity': 1}]
    order = OrderService.create_order(
        actor=customer_actor,
        correlation_id=str(uuid.uuid4()),
        request_id=request_obj.id,
        customer_id=customer_user.id,
        items_data=items_data
    )
    
    mock_publisher.reset_mock()
    corr_id = str(uuid.uuid4())
    OrderService.cancel_order(
        actor=customer_actor,
        correlation_id=corr_id,
        order_id=order.id,
        cancellation_reason="Test"
    )
    
    mock_publisher.publish.assert_called_once()
    args, kwargs = mock_publisher.publish.call_args
    assert kwargs['event_name'] == 'order.cancelled'
    assert kwargs['correlation_id'] == corr_id
    assert kwargs['data']['order_id'] == str(order.id)
    assert kwargs['data']['cancellation_reason'] == "Test"

@patch('apps.orders.services.order_service.event_publisher')
def test_test_ord_024_order_fulfilled_event_emission(mock_publisher, customer_actor, staff_user, customer_user, request_obj, product):
    """
    Inventory:
        TEST-ORD-024
    Rule:
        order.fulfilled event emission
    """
    items_data = [{'product_id': product.id, 'quantity': 1}]
    order = OrderService.create_order(
        actor=customer_actor,
        correlation_id=str(uuid.uuid4()),
        request_id=request_obj.id,
        customer_id=customer_user.id,
        items_data=items_data
    )
    
    order.status = OrderStatus.PAID
    order.save()
    
    staff_actor = Actor(id=staff_user.id, role=Role.STAFF)
    
    mock_publisher.reset_mock()
    corr_id = str(uuid.uuid4())
    OrderService.fulfill_order(
        actor=staff_actor,
        correlation_id=corr_id,
        order_id=order.id
    )
    
    mock_publisher.publish.assert_called_once()
    args, kwargs = mock_publisher.publish.call_args
    assert kwargs['event_name'] == 'order.fulfilled'
    assert kwargs['correlation_id'] == corr_id
    assert kwargs['data']['order_id'] == str(order.id)

