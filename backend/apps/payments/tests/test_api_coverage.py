import pytest
from rest_framework.test import APIClient
from rest_framework import status
from django.urls import reverse
import uuid

pytestmark = pytest.mark.django_db

@pytest.fixture
def api_client():
    return APIClient()

@pytest.fixture
def payment(order, customer_user):
    from apps.payments.models.payment import Payment, PaymentStatus
    from decimal import Decimal
    return Payment.objects.create(
        order_id=order.id,
        request_id=order.request_id,
        customer_id=customer_user.id,
        amount=Decimal("100.00"),
        status=PaymentStatus.PENDING,
        provider_reference=f"REF-{uuid.uuid4().hex[:8]}",
        correlation_id=uuid.uuid4()
    )


def test_payment_api_coverage(api_client, customer_user, payment, order):
    api_client.force_authenticate(user=customer_user)
    
    # Detail GET for customer
    res = api_client.get(f'/api/v1/payments/{payment.id}/')
    assert res.status_code == 200

    # Cancel happy path
    data = {"reason": "Not needed"}
    res = api_client.post(f'/api/v1/payments/{payment.id}/cancel/', data)
    assert res.status_code == 200

def test_payment_api_list_filters(api_client, staff_user, payment, order):
    api_client.force_authenticate(user=staff_user)
    
    # List all
    res = api_client.get('/api/v1/payments/')
    assert res.status_code == 200

    # Filter by state
    res = api_client.get('/api/v1/payments/?state=pending')
    assert res.status_code == 200

    # Filter by order_id
    res = api_client.get(f'/api/v1/payments/?order_id={order.id}')
    assert res.status_code == 200

def test_payment_initialize_validation(api_client, customer_user, order):
    api_client.force_authenticate(user=customer_user)
    # Initialize when order not found
    data = {"order_id": str(uuid.uuid4())}
    res = api_client.post('/api/v1/payments/initialize/', data)
    # The view might return 400 if validation fails, or 404 if order not found
    assert res.status_code in [400, 404]

def test_webhook_malformed_payload(api_client):
    res = api_client.post('/api/v1/payments/webhooks/paystack/', data="invalid json", content_type='application/json')
    assert res.status_code == 400

def test_webhook_unsupported_event(api_client):
    data = {"event": "unsupported.event"}
    res = api_client.post('/api/v1/payments/webhooks/paystack/', data, format='json')
    # Because of invalid signature, it should return 400
    assert res.status_code == 400
