import pytest
import uuid
from decimal import Decimal
from apps.orders.services.order_service import OrderService
from apps.products.models.product import Product

pytestmark = pytest.mark.django_db

from apps.requests.models.request import Request, RequestCategory, PriorityLevel, LifecycleState

def test_test_prod_032_order__inventory_reduction_trigger(staff_user, customer_user, product):
    """
    Inventory:
        TEST-PROD-032
    Rule:
        Order -> Inventory reduction trigger
    """
    initial_qty = product.quantity_available
    
    request = Request.objects.create(
        public_id=f"REQ-{uuid.uuid4().hex[:8]}",
        customer=customer_user,
        category=RequestCategory.PRODUCT_ORDER,
        priority=PriorityLevel.NORMAL,
        status=LifecycleState.AWAITING_PAYMENT,
        description="Test Order Request"
    )
    
    order = OrderService.create_order(
        actor=staff_user,
        correlation_id=str(uuid.uuid4()),
        request_id=request.id,
        customer_id=customer_user.id,
        items_data=[
            {"product_id": str(product.id), "quantity": 5}
        ]
    )
    
    OrderService.process_payment_paid_event(
        actor=staff_user,
        correlation_id=str(uuid.uuid4()),
        order_id=order.id
    )
    
    product.refresh_from_db()
    assert product.quantity_available == initial_qty - 5
