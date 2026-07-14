import pytest
from django.core.exceptions import PermissionDenied
from apps.payments.permissions import PaymentPermissionChecker, PaymentPermissions, WebhookPermissions
from apps.payments.models import PaymentStatus
from apps.common.permissions import Actor, Role

pytestmark = pytest.mark.django_db

def test_payment_permissions_edge_cases(order, customer_user):
    from apps.payments.models.payment import Payment
    import uuid
    from decimal import Decimal
    payment = Payment.objects.create(
        order_id=order.id,
        request_id=order.request_id,
        customer_id=customer_user.id,
        amount=Decimal("100.00"),
        status=PaymentStatus.PENDING,
        provider_reference=f"REF-{uuid.uuid4().hex[:8]}",
        correlation_id=uuid.uuid4()
    )
    # Setup actors
    customer1 = Actor(id=payment.customer_id, role=Role.CUSTOMER)
    customer2 = Actor(id='different-uuid', role=Role.CUSTOMER)
    manager = Actor(id='manager-uuid', role=Role.MANAGER)
    system = Actor(id='system-uuid', role=Role.SYSTEM)
    
    # Cannot initialize another customer's payment
    with pytest.raises(PermissionDenied):
        PaymentPermissionChecker.check(customer2, PaymentPermissions.INITIALIZE, payment=payment)
        
    # VIEW_OWN
    # Cannot view another customer's payment
    with pytest.raises(PermissionDenied):
        PaymentPermissionChecker.check(customer2, PaymentPermissions.VIEW_OWN, payment=payment)
        
    # CANCEL
    # Cannot cancel another customer's payment
    with pytest.raises(PermissionDenied):
        PaymentPermissionChecker.check(customer2, PaymentPermissions.CANCEL, payment=payment)
        
    # Cannot cancel paid payment
    payment.status = PaymentStatus.PAID
    payment.save()
    with pytest.raises(PermissionDenied):
        PaymentPermissionChecker.check(customer1, PaymentPermissions.CANCEL, payment=payment)
        
    # RECONCILE
    assert PaymentPermissionChecker.check(manager, PaymentPermissions.RECONCILE) is True
    
    # WEBHOOK VIEW
    assert PaymentPermissionChecker.check(manager, WebhookPermissions.VIEW) is True
    
    # Unknown permission
    with pytest.raises(PermissionDenied):
        PaymentPermissionChecker.check(customer1, "unknown.permission")
