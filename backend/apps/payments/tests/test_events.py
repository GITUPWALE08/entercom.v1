import pytest
from unittest.mock import patch
from apps.payments.models.payment import Payment, PaymentStatus
from apps.payments.services.payment_service import PaymentService
from apps.payments.services.webhook_service import WebhookService
from apps.common.permissions import Actor, Role
from django.utils import timezone
import uuid
import hmac
import hashlib
import json
from django.core.exceptions import ValidationError

pytestmark = pytest.mark.django_db

def create_valid_signature(payload, secret):
    return hmac.new(
        secret.encode('utf-8'),
        msg=payload,
        digestmod=hashlib.sha512
    ).hexdigest()

@patch('core.events.event_publisher.publish')
def test_test_pay_020_payment_initialized_event_emission(mock_publish, customer_user, request_obj, order):
    """
    Inventory:
        TEST-PAY-020
    Rule:
        payment.initialized event emission
    """
    actor = Actor(id=customer_user.id, role=Role.CUSTOMER)
    corr_id = str(uuid.uuid4())
    
    PaymentService.initialize_payment(
        actor=actor,
        correlation_id=corr_id,
        order_id=order.id,
        request_id=request_obj.id,
        customer_id=customer_user.id,
        amount=order.total_amount,
        currency="NGN",
        provider_reference="REF-INIT-EVENT"
    )
    
    mock_publish.assert_called_once()
    kwargs = mock_publish.call_args.kwargs
    assert kwargs['event_name'] == 'payment.initialized'
    assert kwargs['event_version'] == 1
    assert kwargs['correlation_id'] == corr_id
    assert kwargs['producer'] == 'PaymentService'

@patch('core.events.event_publisher.publish')
def test_test_pay_021_payment_paid_event_emission(mock_publish, customer_user, request_obj, order):
    """
    Inventory:
        TEST-PAY-021
    Rule:
        payment.paid event emission
    """
    actor = Actor(id=uuid.uuid4(), role=Role.SYSTEM)
    payment = Payment.objects.create(
        order=order, request=request_obj, customer=customer_user,
        provider_reference="REF-PAID-EVENT", amount=100.00,
        status=PaymentStatus.PENDING, correlation_id=uuid.uuid4()
    )
    
    secret = "secret"
    payload = {"event": "charge.success", "data": {"reference": "REF-PAID-EVENT"}}
    raw_body = json.dumps(payload).encode('utf-8')
    sig = create_valid_signature(raw_body, secret)
    
    WebhookService.process_webhook(actor, str(uuid.uuid4()), payload, sig, secret, raw_body)
    
    assert any(call.kwargs['event_name'] == 'payment.paid' for call in mock_publish.mock_calls)

@patch('core.events.event_publisher.publish')
def test_test_pay_022_payment_failed_event_emission(mock_publish, customer_user, request_obj, order):
    """
    Inventory:
        TEST-PAY-022
    Rule:
        payment.failed event emission
    """
    actor = Actor(id=uuid.uuid4(), role=Role.SYSTEM)
    payment = Payment.objects.create(
        order=order, request=request_obj, customer=customer_user,
        provider_reference="REF-FAIL-EVENT", amount=100.00,
        status=PaymentStatus.PENDING, correlation_id=uuid.uuid4()
    )
    
    secret = "secret"
    payload = {"event": "charge.failed", "data": {"reference": "REF-FAIL-EVENT", "gateway_response": "Failed"}}
    raw_body = json.dumps(payload).encode('utf-8')
    sig = create_valid_signature(raw_body, secret)
    
    WebhookService.process_webhook(actor, str(uuid.uuid4()), payload, sig, secret, raw_body)
    
    assert any(call.kwargs['event_name'] == 'payment.failed' for call in mock_publish.mock_calls)

@patch('core.events.event_publisher.publish')
def test_test_pay_023_payment_cancelled_event_emission(mock_publish, customer_user, request_obj, order):
    """
    Inventory:
        TEST-PAY-023
    Rule:
        payment.cancelled event emission
    """
    actor = Actor(id=customer_user.id, role=Role.CUSTOMER)
    payment = Payment.objects.create(
        order=order, request=request_obj, customer=customer_user,
        provider_reference="REF-CANCEL-EVENT", amount=100.00,
        status=PaymentStatus.PENDING, correlation_id=uuid.uuid4()
    )
    
    corr_id = str(uuid.uuid4())
    PaymentService.cancel_payment(actor, corr_id, payment.id)
    
    mock_publish.assert_called_once()
    kwargs = mock_publish.call_args.kwargs
    assert kwargs['event_name'] == 'payment.cancelled'
    assert kwargs['event_version'] == 1
    assert kwargs['correlation_id'] == corr_id
    assert kwargs['producer'] == 'PaymentService'

@patch('core.events.event_publisher.publish')
def test_test_pay_024_payment_expired_event_emission(mock_publish, customer_user, request_obj, order):
    """
    Inventory:
        TEST-PAY-024
    Rule:
        payment.expired event emission
    """
    actor = Actor(id=uuid.uuid4(), role=Role.SYSTEM)
    payment = Payment.objects.create(
        order=order, request=request_obj, customer=customer_user,
        provider_reference="REF-EXP-EVENT", amount=100.00,
        status=PaymentStatus.PENDING, correlation_id=uuid.uuid4()
    )
    Payment.objects.filter(id=payment.id).update(created_at=timezone.now() - timezone.timedelta(hours=48))
    
    corr_id = str(uuid.uuid4())
    PaymentService.expire_payments(actor, corr_id)
    
    mock_publish.assert_called_once()
    kwargs = mock_publish.call_args.kwargs
    assert kwargs['event_name'] == 'payment.expired'
    assert kwargs['event_version'] == 1
    assert kwargs['correlation_id'] == corr_id
    assert kwargs['producer'] == 'PaymentService'

@patch('core.events.event_publisher.publish')
def test_test_pay_025_webhook_received_event_emission(mock_publish, customer_user, request_obj, order):
    """
    Inventory:
        TEST-PAY-025
    Rule:
        webhook.received event emission
    """
    actor = Actor(id=uuid.uuid4(), role=Role.SYSTEM)
    payment = Payment.objects.create(
        order=order, request=request_obj, customer=customer_user,
        provider_reference="REF-RCV-EVENT", amount=100.00,
        status=PaymentStatus.PENDING, correlation_id=uuid.uuid4()
    )
    
    secret = "secret"
    payload = {"event": "charge.success", "data": {"reference": "REF-RCV-EVENT"}}
    raw_body = json.dumps(payload).encode('utf-8')
    sig = create_valid_signature(raw_body, secret)
    
    WebhookService.process_webhook(actor, str(uuid.uuid4()), payload, sig, secret, raw_body)
    
    assert any(call.kwargs['event_name'] == 'webhook.received' for call in mock_publish.mock_calls)

@patch('core.events.event_publisher.publish')
def test_test_pay_026_webhook_rejected_event_emission(mock_publish, customer_user, request_obj, order):
    """
    Inventory:
        TEST-PAY-026
    Rule:
        webhook.rejected event emission
    """
    actor = Actor(id=uuid.uuid4(), role=Role.SYSTEM)
    
    secret = "secret"
    payload = {"event": "charge.success", "data": {"reference": "REF-REJ-EVENT"}}
    raw_body = json.dumps(payload).encode('utf-8')
    sig = "invalid_sig"
    
    corr_id = str(uuid.uuid4())
    with pytest.raises(ValidationError):
        WebhookService.process_webhook(actor, corr_id, payload, sig, secret, raw_body)
    
    mock_publish.assert_called_once()
    kwargs = mock_publish.call_args.kwargs
    assert kwargs['event_name'] == 'webhook.rejected'
    assert kwargs['event_version'] == 1
    assert kwargs['correlation_id'] == corr_id
    assert kwargs['producer'] == 'WebhookService'

