import pytest
from rest_framework import status
from rest_framework.test import APIClient
from apps.payments.models.payment import Payment, PaymentStatus
from apps.payments.services.payment_service import PaymentService
from apps.common.permissions import Actor, Role
import uuid
import hmac
import hashlib
import json

pytestmark = pytest.mark.django_db

@pytest.fixture
def api_client():
    return APIClient()

def create_valid_signature(payload, secret):
    return hmac.new(
        secret.encode('utf-8'),
        msg=payload,
        digestmod=hashlib.sha512
    ).hexdigest()

def test_test_pay_016_post_api_v1_orders_id_initialize_payment(api_client, customer_user, order):
    """
    Inventory:
        TEST-PAY-016
    Rule:
        POST /api/v1/payments/initialize/
    """
    api_client.force_authenticate(user=customer_user)
    
    response = api_client.post('/api/v1/payments/initialize/', data={"order_id": str(order.id)}, format='json')
    assert response.status_code == status.HTTP_201_CREATED
    assert response.data['status'] == 'pending'

def test_test_pay_017_post_api_v1_payments_id_cancel(api_client, customer_user, request_obj, order):
    """
    Inventory:
        TEST-PAY-017
    Rule:
        POST /api/v1/payments/{id}/cancel/
    """
    api_client.force_authenticate(user=customer_user)
    
    payment = Payment.objects.create(
        order=order,
        request=request_obj,
        customer=customer_user,
        provider_reference="REF-CANCEL",
        amount=100.00,
        status=PaymentStatus.PENDING,
        correlation_id=uuid.uuid4()
    )
    
    response = api_client.post(f'/api/v1/payments/{payment.id}/cancel/', data={"reason": "Test cancel"})
    assert response.status_code == status.HTTP_200_OK
    
    payment.refresh_from_db()
    assert payment.status == PaymentStatus.CANCELLED

def test_test_pay_018_post_api_v1_payments_webhooks_paystack(api_client, customer_user, request_obj, order):
    """
    Inventory:
        TEST-PAY-018
    Rule:
        POST /api/v1/payments/webhooks/paystack/
    """
    payment = Payment.objects.create(
        order=order,
        request=request_obj,
        customer=customer_user,
        provider_reference="REF-WEBHOOK",
        amount=100.00,
        status=PaymentStatus.PENDING,
        correlation_id=uuid.uuid4()
    )
    
    from django.conf import settings
    secret = getattr(settings, 'PAYSTACK_SECRET_KEY', 'SECRET')
    payload = {"event": "charge.success", "data": {"reference": "REF-WEBHOOK"}}
    raw_body = json.dumps(payload).encode('utf-8')
    sig = create_valid_signature(raw_body, secret)
    
    response = api_client.post(
        '/api/v1/payments/webhooks/paystack/', 
        data=raw_body, 
        content_type='application/json',
        HTTP_X_PAYSTACK_SIGNATURE=sig
    )
    
    assert response.status_code == status.HTTP_200_OK
    
    payment.refresh_from_db()
    assert payment.status == PaymentStatus.PAID

def test_test_pay_019_get_api_v1_payments(api_client, customer_user, request_obj, order):
    """
    Inventory:
        TEST-PAY-019
    Rule:
        GET /api/v1/payments/
    """
    api_client.force_authenticate(user=customer_user)
    
    Payment.objects.create(
        order=order,
        request=request_obj,
        customer=customer_user,
        provider_reference="REF-GET",
        amount=100.00,
        status=PaymentStatus.PENDING,
        correlation_id=uuid.uuid4()
    )
    
    response = api_client.get('/api/v1/payments/')
    assert response.status_code == status.HTTP_200_OK
    assert len(response.data) == 1

