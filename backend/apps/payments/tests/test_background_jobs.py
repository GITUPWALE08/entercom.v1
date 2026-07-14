import pytest
from unittest.mock import patch
from apps.payments.models.payment import Payment, PaymentStatus
from apps.payments.tasks import expire_payments_job
from django.utils import timezone
import uuid

pytestmark = pytest.mark.django_db

@patch('apps.payments.services.payment_service.PaymentService.expire_payments')
def test_test_pay_030_payment_expiry_job_selection_logic(mock_expire):
    """
    Inventory:
        TEST-PAY-030
    Rule:
        Payment Expiry job selection logic
    """
    expire_payments_job()
    mock_expire.assert_called_once()

def test_test_pay_031_payment_expiry_job_state_transition(customer_user, request_obj, order):
    """
    Inventory:
        TEST-PAY-031
    Rule:
        Payment Expiry job state transition
    """
    payment = Payment.objects.create(
        order=order,
        request=request_obj,
        customer=customer_user,
        provider_reference="REF-JOB-STATE",
        amount=100.00,
        status=PaymentStatus.PENDING,
        correlation_id=uuid.uuid4()
    )
    Payment.objects.filter(id=payment.id).update(created_at=timezone.now() - timezone.timedelta(hours=48))
    
    expire_payments_job()
    
    payment.refresh_from_db()
    assert payment.status == PaymentStatus.CANCELLED

@patch('core.events.event_publisher.publish')
def test_test_pay_032_payment_expiry_job_event_and_audit_emission(mock_publish, customer_user, request_obj, order):
    """
    Inventory:
        TEST-PAY-032
    Rule:
        Payment Expiry job event and audit emission
    """
    payment = Payment.objects.create(
        order=order,
        request=request_obj,
        customer=customer_user,
        provider_reference="REF-JOB-EVT",
        amount=100.00,
        status=PaymentStatus.PENDING,
        correlation_id=uuid.uuid4()
    )
    Payment.objects.filter(id=payment.id).update(created_at=timezone.now() - timezone.timedelta(hours=48))
    
    expire_payments_job()
    
    assert mock_publish.called

@patch('apps.payments.services.payment_service.PaymentService.expire_payments')
def test_test_pay_033_payment_expiry_job_retry_handling(mock_expire):
    """
    Inventory:
        TEST-PAY-033
    Rule:
        Payment Expiry job retry handling
    """
    mock_expire.side_effect = Exception("Test Error")
    
    with pytest.raises(Exception):
        expire_payments_job()

def test_test_pay_034_payment_expiry_job_idempotency(customer_user, request_obj, order):
    """
    Inventory:
        TEST-PAY-034
    Rule:
        Payment Expiry job idempotency
    """
    payment = Payment.objects.create(
        order=order,
        request=request_obj,
        customer=customer_user,
        provider_reference="REF-JOB-IDEMP",
        amount=100.00,
        status=PaymentStatus.PENDING,
        correlation_id=uuid.uuid4()
    )
    Payment.objects.filter(id=payment.id).update(created_at=timezone.now() - timezone.timedelta(hours=48))
    
    expire_payments_job()
    payment.refresh_from_db()
    assert payment.status == PaymentStatus.CANCELLED
    
    # Run again
    expire_payments_job()
    payment.refresh_from_db()
    assert payment.status == PaymentStatus.CANCELLED

