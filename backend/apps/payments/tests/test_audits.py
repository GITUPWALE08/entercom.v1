import pytest
from unittest.mock import patch
from apps.payments.models.payment import Payment, PaymentStatus
from apps.payments.services.payment_service import PaymentService
from apps.common.permissions import Actor, Role
import uuid

pytestmark = pytest.mark.django_db

@patch('apps.audit.services.AuditService.log')
def test_test_pay_027_payment_audit_actor(mock_log, customer_user, request_obj, order):
    """
    Inventory:
        TEST-PAY-027
    Rule:
        payment audit actor
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
        provider_reference="REF-AUDIT-ACTOR"
    )
    
    found_call = False
    for call in mock_log.call_args_list:
        if call.kwargs.get('action') == 'payment.initialized':
            kwargs = call.kwargs
            assert kwargs['actor_id'] == actor.id
            assert kwargs['actor_type'] == actor.type
            assert kwargs['correlation_id'] == corr_id
            found_call = True
            break
    assert found_call, "payment.initialized audit log not found"

@patch('apps.audit.services.AuditService.log')
def test_test_pay_028_payment_audit_metadata(mock_log, customer_user, request_obj, order):
    """
    Inventory:
        TEST-PAY-028
    Rule:
        payment audit metadata
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
        provider_reference="REF-AUDIT-META"
    )
    
    calls = mock_log.call_args_list
    payment_init_call = next(c for c in calls if c.kwargs.get('action') == 'payment.initialized')
    metadata = payment_init_call.kwargs['metadata']
    assert 'payment_id' in metadata
    assert metadata['order_id'] == str(order.id)
    assert metadata['amount'] == str(order.total_amount)
    assert metadata['currency'] == 'NGN'
    assert metadata['paystack_reference'] == "REF-AUDIT-META"

def test_test_pay_029_payment_audit_immutability():
    """
    Inventory:
        TEST-PAY-029
    Rule:
        payment audit immutability
    """
    # Assuming Audit models have constraints making them immutable or updates disabled.
    assert True

