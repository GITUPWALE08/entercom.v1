import pytest
import uuid
from decimal import Decimal
from apps.products.services.product_service import ProductService
from apps.audit.models import AuditRecord
from apps.audit.exceptions import ImmutabilityViolationError

pytestmark = pytest.mark.django_db

def test_test_prod_029_product_audit_creation_and_metadata(staff_user, category):
    corr_id = str(uuid.uuid4())
    ProductService.create_product(
        actor=staff_user,
        correlation_id=corr_id,
        category_id=category.id,
        name="Audit Prod",
        unit_price=Decimal("10.00"),
        quantity_available=5,
        low_stock_threshold=2,
        sku="SKU-AUD"
    )
    
    record = AuditRecord.objects.get(correlation_id=corr_id)
    assert record.action == 'product.created'
    assert record.actor_type == 'Staff'
    assert record.metadata['sku'] == 'SKU-AUD'

def test_test_prod_030_product_audit_immutability(staff_user, category):
    corr_id = str(uuid.uuid4())
    ProductService.create_product(
        actor=staff_user,
        correlation_id=corr_id,
        category_id=category.id,
        name="Immutable Prod",
        unit_price=Decimal("10.00"),
        quantity_available=5,
        low_stock_threshold=2,
        sku="SKU-IMM"
    )
    
    record = AuditRecord.objects.get(correlation_id=corr_id)
    record.action = "tampered"
    
    with pytest.raises(ImmutabilityViolationError):
        record.save()
