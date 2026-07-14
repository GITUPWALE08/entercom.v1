import pytest
import uuid
from decimal import Decimal
from django.contrib.auth import get_user_model
from apps.products.models.category import ProductCategory
from apps.products.models.product import Product, ProductStatus
from apps.requests.models.request import Request, RequestCategory, PriorityLevel, LifecycleState
from apps.orders.models.order import Order, OrderStatus

User = get_user_model()

@pytest.fixture
def admin_user():
    return User.objects.create(email="admin@example.com", is_staff=True, is_superuser=True, password="password", role="SUPER_ADMIN")

@pytest.fixture
def manager_user():
    return User.objects.create(email="manager@example.com", is_staff=True, password="password", role="MANAGER")

@pytest.fixture
def staff_user():
    return User.objects.create(email="staff@example.com", is_staff=True, password="password", role="STAFF")

@pytest.fixture
def customer_user():
    return User.objects.create(email="customer@example.com", is_staff=False, password="password", role="CUSTOMER")

@pytest.fixture
def request_obj(customer_user):
    return Request.objects.create(
        public_id=f"REQ-{uuid.uuid4().hex[:8]}",
        customer=customer_user,
        category=RequestCategory.PRODUCT_ORDER,
        priority=PriorityLevel.NORMAL,
        status=LifecycleState.AWAITING_PAYMENT,
        description="I would like to order some items."
    )

@pytest.fixture
def order(customer_user, request_obj):
    return Order.objects.create(
        request=request_obj,
        customer=customer_user,
        total_amount=Decimal("100.00"),
        status=OrderStatus.PENDING_PAYMENT
    )
