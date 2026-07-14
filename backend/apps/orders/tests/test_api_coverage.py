import pytest
from rest_framework.test import APIClient
from rest_framework import status
import uuid

pytestmark = pytest.mark.django_db

@pytest.fixture
def api_client():
    return APIClient()

@pytest.fixture
def order(customer_user, request_obj, product):
    from apps.orders.services.order_service import OrderService
    from apps.common.permissions import Actor, Role
    return OrderService.create_order(
        actor=Actor(id=customer_user.id, role=Role.CUSTOMER),
        correlation_id=str(uuid.uuid4()),
        request_id=request_obj.id,
        customer_id=customer_user.id,
        items_data=[{'product_id': product.id, 'quantity': 1}]
    )

def test_order_api_coverage(api_client, staff_user, manager_user, customer_user, order, request_obj, product):
    api_client.force_authenticate(user=staff_user)
def test_order_api_coverage(api_client, customer_user, manager_user, order, product, request_obj):
    api_client.force_authenticate(user=customer_user)
    
    # List GET
    res = api_client.get(f'/api/v1/orders/?customer_id={order.customer_id}')
    assert res.status_code == 200

    # Detail GET for non-customer
    res = api_client.get(f'/api/v1/orders/{order.id}/')
    assert res.status_code == 200

    # Create happy path
    data = {
        "request_id": str(request_obj.id),
        "items": [
            {"product_id": str(product.id), "quantity": 1}
        ]
    }
    api_client.force_authenticate(user=manager_user)
    # Manager can't create order, wait. Customers create orders.
    # But wait, customers need to be tested for happy path.
    from django.contrib.auth import get_user_model
    User = get_user_model()
    from apps.requests.models.request import Request, RequestCategory, PriorityLevel, LifecycleState
    new_req = Request.objects.create(
        public_id=f"REQ-{uuid.uuid4().hex[:8]}",
        customer=customer_user,
        category=RequestCategory.PRODUCT_ORDER,
        priority=PriorityLevel.NORMAL,
        status=LifecycleState.AWAITING_PAYMENT,
        description="New order request"
    )

    data = {
        "request_id": str(new_req.id),
        "items": [
            {"product_id": str(product.id), "quantity": 1}
        ]
    }
    api_client.force_authenticate(user=customer_user)
    res = api_client.post('/api/v1/orders/', data, format='json')
    assert res.status_code == 201

def test_order_cancel_validation(api_client, customer_user, order):
    api_client.force_authenticate(user=customer_user)
    # Force validation error in cancel_order.
    # Service raises ValidationError if order is not pending or payment_required
    from apps.orders.models.order import OrderStatus
    order.status = OrderStatus.PAID
    order.save()
    
    data = {"reason": "Don't want it"}
    res = api_client.post(f'/api/v1/orders/{order.id}/cancel/', data)
    assert res.status_code == 400

def test_order_fulfill_validation(api_client, manager_user, order):
    api_client.force_authenticate(user=manager_user)
    # Force validation error in fulfill_order
    # Order must be PAID
    from apps.orders.models.order import OrderStatus
    order.status = OrderStatus.CREATED
    order.save()
    
    res = api_client.post(f'/api/v1/orders/{order.id}/fulfill/')
    assert res.status_code == 400
