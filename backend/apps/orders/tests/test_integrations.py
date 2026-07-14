import pytest
from rest_framework import status
from rest_framework.test import APIClient
from apps.orders.services.order_service import OrderService
from apps.orders.models import OrderStatus
from apps.products.models.product import ProductStatus
from apps.common.permissions import Actor, Role
from apps.audit.models import AuditRecord
import uuid

pytestmark = pytest.mark.django_db

@pytest.fixture
def api_client():
    return APIClient()

def test_test_ord_029_order__payment_hand_off(customer_user, request_obj, product):
    """
    Inventory:
        TEST-ORD-029
    Rule:
        Order -> Payment hand-off
    """
    items_data = [{'product_id': product.id, 'quantity': 1}]
    actor = Actor(id=customer_user.id, role=Role.CUSTOMER)
    
    order = OrderService.create_order(
        actor=actor,
        correlation_id=str(uuid.uuid4()),
        request_id=request_obj.id,
        customer_id=customer_user.id,
        items_data=items_data
    )
    
    OrderService.require_payment(
        actor=actor,
        correlation_id=str(uuid.uuid4()),
        order_id=order.id,
        payment_id=str(uuid.uuid4()),
        amount=order.total_amount
    )
    order.refresh_from_db()
    assert order.status == OrderStatus.PENDING_PAYMENT

def test_test_ord_030_order__inventory_reduction(customer_user, request_obj, product):
    """
    Inventory:
        TEST-ORD-030
    Rule:
        Order -> Inventory reduction
    """
    items_data = [{'product_id': product.id, 'quantity': 2}]
    actor = Actor(id=customer_user.id, role=Role.CUSTOMER)
    
    order = OrderService.create_order(
        actor=actor,
        correlation_id=str(uuid.uuid4()),
        request_id=request_obj.id,
        customer_id=customer_user.id,
        items_data=items_data
    )
    
    initial_qty = product.quantity_available
    
    OrderService.require_payment(
        actor=actor,
        correlation_id=str(uuid.uuid4()),
        order_id=order.id,
        payment_id=str(uuid.uuid4()),
        amount=order.total_amount
    )
    
    OrderService.process_payment_paid_event(
        actor=actor,
        correlation_id=str(uuid.uuid4()),
        order_id=order.id
    )
    
    product.refresh_from_db()
    assert product.quantity_available == initial_qty - 2

def test_test_ord_031_order__audit_persistence(customer_user, request_obj, product):
    """
    Inventory:
        TEST-ORD-031
    Rule:
        Order -> Audit persistence
    """
    items_data = [{'product_id': product.id, 'quantity': 1}]
    actor = Actor(id=customer_user.id, role=Role.CUSTOMER)
    corr_id = str(uuid.uuid4())
    
    order = OrderService.create_order(
        actor=actor,
        correlation_id=corr_id,
        request_id=request_obj.id,
        customer_id=customer_user.id,
        items_data=items_data
    )
    
    assert AuditRecord.objects.filter(correlation_id=corr_id).exists()

def test_test_ord_032_order__events_emission(customer_user, request_obj, product):
    """
    Inventory:
        TEST-ORD-032
    Rule:
        Order -> Events emission
    """
    from unittest.mock import patch
    
    items_data = [{'product_id': product.id, 'quantity': 1}]
    actor = Actor(id=customer_user.id, role=Role.CUSTOMER)
    corr_id = str(uuid.uuid4())
    
    with patch('apps.orders.services.order_service.event_publisher.publish') as mock_pub:
        order = OrderService.create_order(
            actor=actor,
            correlation_id=corr_id,
            request_id=request_obj.id,
            customer_id=customer_user.id,
            items_data=items_data
        )
        mock_pub.assert_called_once()
        assert mock_pub.call_args[1]['event_name'] == 'order.created'

def test_test_ord_033_correlation_chain_propagation(customer_user, request_obj, product):
    """
    Inventory:
        TEST-ORD-033
    Rule:
        Correlation chain propagation
    """
    items_data = [{'product_id': product.id, 'quantity': 1}]
    actor = Actor(id=customer_user.id, role=Role.CUSTOMER)
    corr_id = str(uuid.uuid4())
    
    OrderService.create_order(
        actor=actor,
        correlation_id=corr_id,
        request_id=request_obj.id,
        customer_id=customer_user.id,
        items_data=items_data
    )
    
    audit = AuditRecord.objects.get(action='order.created', correlation_id=corr_id)
    assert audit.correlation_id == corr_id

def test_test_ord_034_order_create_rejects_archived_product(customer_user, request_obj, product):
    """
    Inventory:
        TEST-ORD-034
    Rule:
        order_create_rejects_archived_product
    """
    product.status = ProductStatus.ARCHIVED
    product.save()
    
    items_data = [{'product_id': product.id, 'quantity': 1}]
    actor = Actor(id=customer_user.id, role=Role.CUSTOMER)
    
    from django.core.exceptions import ValidationError
    with pytest.raises(ValidationError):
        OrderService.create_order(
            actor=actor,
            correlation_id=str(uuid.uuid4()),
            request_id=request_obj.id,
            customer_id=customer_user.id,
            items_data=items_data
        )

def test_test_ord_035_order_api_rejects_archived_product(api_client, customer_user, request_obj, product):
    """
    Inventory:
        TEST-ORD-035
    Rule:
        order_api_rejects_archived_product
    """
    api_client.force_authenticate(user=customer_user)
    
    product.status = ProductStatus.ARCHIVED
    product.save()
    
    data = {
        "request_id": str(request_obj.id),
        "items": [
            {"product_id": str(product.id), "quantity": 1}
        ]
    }
    
    response = api_client.post('/api/v1/orders/', data=data, format='json')
    assert response.status_code == status.HTTP_400_BAD_REQUEST

def test_test_ord_036_idor_api_validation_on_retrieve(api_client, customer_user, request_obj, product):
    """
    Inventory:
        TEST-ORD-036
    Rule:
        IDOR API validation on retrieve
    """
    from django.contrib.auth import get_user_model
    User = get_user_model()
    other_customer = User.objects.create(email="other@example.com", is_staff=False, password="password", role="CUSTOMER")
    
    items_data = [{'product_id': product.id, 'quantity': 1}]
    actor = Actor(id=customer_user.id, role=Role.CUSTOMER)
    
    order = OrderService.create_order(
        actor=actor,
        correlation_id=str(uuid.uuid4()),
        request_id=request_obj.id,
        customer_id=customer_user.id,
        items_data=items_data
    )
    
    api_client.force_authenticate(user=other_customer)
    response = api_client.get(f'/api/v1/orders/{order.id}/')
    assert response.status_code == status.HTTP_403_FORBIDDEN

