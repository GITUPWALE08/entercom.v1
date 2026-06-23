import logging
import uuid
from celery import shared_task
from django.db.models import F
from apps.products.models import Product, ProductStatus
from apps.products.services.inventory_service import InventoryService

logger = logging.getLogger(__name__)

class SystemActor:
    id = "SYSTEM"
    type = "SYSTEM"

@shared_task(
    bind=True, 
    max_retries=3, 
    autoretry_for=(Exception,), 
    retry_backoff=True, 
    retry_jitter=True
)
def inventory_low_stock_job(self):
    """
    Detects products below low_stock_threshold and emits events via InventoryService.
    """
    try:
        low_stock_products = Product.objects.filter(
            status=ProductStatus.ACTIVE,
            quantity_available__lte=F('low_stock_threshold')
        )
        
        actor = SystemActor()
        errors = []
        
        for product in low_stock_products:
            try:
                correlation_id = str(uuid.uuid4())
                
                InventoryService._emit_low_stock(
                    actor=actor,
                    correlation_id=correlation_id,
                    product=product
                )
            except Exception as e:
                logger.error(f"Failed to process low stock for product {product.id}: {str(e)}")
                errors.append(e)
                
        if errors:
            raise Exception(f"Job completed with {len(errors)} partial failures. Triggering retry.")
            
    except Exception as exc:
        logger.error(f"inventory_low_stock_job failed: {str(exc)}")
        raise
