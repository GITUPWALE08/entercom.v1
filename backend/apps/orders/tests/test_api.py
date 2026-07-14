import pytest
from rest_framework import status
from rest_framework.test import APIClient
from apps.orders.models import Order, OrderStatus
from apps.orders.services.order_service import OrderService
from apps.common.permissions import Actor, Role
import uuid

pytestmark = pytest.mark.django_db

@pytest.fixture
def api_client():
    return APIClient()

def test_test_ord_017_post_api_v1_orders_validation(api_client, customer_user):
    """
    Inventory:
        TEST-ORD-017
    Rule:
        POST /api/v1/orders/ validation
    """
    api_client.force_authenticate(user=customer_user)
    
    data = {
        "request_id": str(uuid.uuid4()),
        "items": []
    }
    
    response = api_client.post('/api/v1/orders/', data=data, format='json')
    assert response.status_code == status.HTTP_400_BAD_REQUEST

def test_test_ord_018_get_api_v1_orders_listing(api_client, customer_user, request_obj, product):
    """
    Inventory:
        TEST-ORD-018
    Rule:
        GET /api/v1/orders/ listing
    """
    api_client.force_authenticate(user=customer_user)
    
    items_data = [{'product_id': product.id, 'quantity': 1}]
    OrderService.create_order(
        actor=Actor(id=customer_user.id, role=Role.CUSTOMER),
        correlation_id=str(uuid.uuid4()),
        request_id=request_obj.id,
        customer_id=customer_user.id,
        items_data=items_data
    )
    
    response = api_client.get('/api/v1/orders/')
    assert response.status_code == status.HTTP_200_OK
    assert len(response.data) == 1

def test_test_ord_019_get_api_v1_orders_id_retrieve(api_client, customer_user, request_obj, product):
    """
    Inventory:
        TEST-ORD-019
    Rule:
        GET /api/v1/orders/{id}/ retrieve
    """
    api_client.force_authenticate(user=customer_user)
    
    items_data = [{'product_id': product.id, 'quantity': 1}]
    order = OrderService.create_order(
        actor=Actor(id=customer_user.id, role=Role.CUSTOMER),
        correlation_id=str(uuid.uuid4()),
        request_id=request_obj.id,
        customer_id=customer_user.id,
        items_data=items_data
    )
    
    response = api_client.get(f'/api/v1/orders/{order.id}/')
    assert response.status_code == status.HTTP_200_OK
    assert response.data['id'] == str(order.id)

def test_test_ord_020_post_api_v1_orders_id_cancel(api_client, customer_user, request_obj, product):
    """
    Inventory:
        TEST-ORD-020
    Rule:
        POST /api/v1/orders/{id}/cancel/
    """
    api_client.force_authenticate(user=customer_user)
    
    items_data = [{'product_id': product.id, 'quantity': 1}]
    order = OrderService.create_order(
        actor=Actor(id=customer_user.id, role=Role.CUSTOMER),
        correlation_id=str(uuid.uuid4()),
        request_id=request_obj.id,
        customer_id=customer_user.id,
        items_data=items_data
    )
    
    response = api_client.post(f'/api/v1/orders/{order.id}/cancel/', data={"reason": "Test"}, format='json')
    assert response.status_code == status.HTTP_200_OK
    
    order.refresh_from_db()
    assert order.status == OrderStatus.CANCELLED

def test_test_ord_021_post_api_v1_orders_id_fulfill(api_client, staff_user, customer_user, request_obj, product):
    """
    Inventory:
        TEST-ORD-021
    Rule:
        POST /api/v1/orders/{id}/fulfill/
    """
    api_client.force_authenticate(user=staff_user)
    
    items_data = [{'product_id': product.id, 'quantity': 1}]
    order = OrderService.create_order(
        actor=Actor(id=customer_user.id, role=Role.CUSTOMER),
        correlation_id=str(uuid.uuid4()),
        request_id=request_obj.id,
        customer_id=customer_user.id,
        items_data=items_data
    )
    
    order.status = OrderStatus.PAID
    order.save()
    
    response = api_client.post(f'/api/v1/orders/{order.id}/fulfill/')
    assert response.status_code == status.HTTP_200_OK
    
    order.refresh_from_db()
    assert order.status == OrderStatus.FULFILLED

