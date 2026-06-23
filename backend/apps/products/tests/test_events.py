import pytest
import uuid
from decimal import Decimal
from unittest.mock import patch
from apps.products.services.product_service import ProductService
from apps.products.services.inventory_service import InventoryService
from django.contrib.auth import get_user_model

User = get_user_model()
pytestmark = pytest.mark.django_db

def test_test_prod_026_product_created_event_emission(staff_user, category):
    with patch('core.events.EventPublisher.publish') as mock_publish:
        ProductService.create_product(
            actor=staff_user,
            correlation_id="corr-123",
            category_id=category.id,
            name="Event Prod",
            unit_price=Decimal("10.00"),
            quantity_available=5,
            low_stock_threshold=2,
            sku="SKU-EV"
        )
        assert mock_publish.called
        args, kwargs = mock_publish.call_args
        assert kwargs['event_name'] == 'product.created'
        assert kwargs['correlation_id'] == 'corr-123'
        assert kwargs['data']['sku'] == 'SKU-EV'

def test_test_prod_027_inventory_adjusted_event_emission(admin_user, product):
    with patch('core.events.EventPublisher.publish') as mock_publish:
        InventoryService.adjust_inventory(
            actor=admin_user,
            correlation_id="corr-adj",
            product_id=product.id,
            adjustment_amount=10,
            reason="test adjustment"
        )
        assert mock_publish.called
        args, kwargs = mock_publish.call_args
        assert kwargs['event_name'] == 'inventory.adjusted'
        assert kwargs['correlation_id'] == 'corr-adj'
        assert kwargs['data']['adjustment_amount'] == 10

def test_test_prod_028_inventory_low_stock_event_emission(admin_user, product):
    product.quantity_available = 10
    product.low_stock_threshold = 5
    product.save()
    
    with patch('core.events.EventPublisher.publish') as mock_publish:
        InventoryService.reduce_inventory(
            actor=admin_user,
            correlation_id="corr-low",
            order_id=uuid.uuid4(),
            reductions=[{"product_id": product.id, "quantity": 8}] # 10 - 8 = 2 <= 5
        )
        # Should publish both 'inventory.reduced' and 'inventory.low_stock'
        event_names = [call.kwargs.get('event_name') for call in mock_publish.call_args_list]
        assert 'inventory.reduced' in event_names
        assert 'inventory.low_stock' in event_names
