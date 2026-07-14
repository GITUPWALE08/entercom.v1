from django.db import transaction
from django.core.exceptions import ValidationError
from django.utils import timezone
from apps.products.models import Product
from core.events import event_publisher
from apps.audit.services import AuditService as audit_logger, resolve_actor_type
from core.permissions import require_permission

class InventoryService:
    """
    Authoritative engine for stock validation, depletion, and low-stock threshold evaluation.
    """
    @staticmethod
    @transaction.atomic
    def reduce_inventory(actor, correlation_id, order_id, reductions):
        product_ids = [r['product_id'] for r in reductions]
        products = {str(p.id): p for p in Product.objects.select_for_update().filter(id__in=product_ids)}

        for reduction in reductions:
            pid = str(reduction['product_id'])
            if pid not in products:
                raise ValidationError(f"Product {pid} not found.")
            
            product = products[pid]
            quantity_before = product.quantity_available
            quantity_reduced = reduction['quantity']
            
            if product.quantity_available < quantity_reduced:
                raise ValidationError(f"Insufficient stock for product {pid}.")
                
            product.quantity_available -= quantity_reduced
            product.save()
            quantity_after = product.quantity_available

            audit_logger.log(
                action='inventory.reduced',
                actor_id=actor.id,
                actor_type=resolve_actor_type(actor),
                correlation_id=correlation_id,
                metadata={
                    'products_affected': [pid],
                    'order_id': str(order_id),
                    'quantity_before': quantity_before,
                    'quantity_after': quantity_after,
                    'quantity_reduced': quantity_reduced
                }
            )

            event_publisher.publish(
                event_name='inventory.reduced',
                event_version=1,
                correlation_id=correlation_id,
                occurred_at=timezone.now(),
                producer='InventoryService',
                data={
                    'product_id': pid,
                    'order_id': str(order_id),
                    'quantity_before': quantity_before,
                    'quantity_after': quantity_after,
                    'quantity_reduced': quantity_reduced
                }
            )
            
            if quantity_after <= product.low_stock_threshold:
                InventoryService._emit_low_stock(actor, correlation_id, product)

    @staticmethod
    @transaction.atomic
    def adjust_inventory(actor, correlation_id, product_id, adjustment_amount, reason):
        require_permission(actor, 'inventory.adjust')
        product = Product.objects.select_for_update().filter(id=product_id).first()
        if not product:
            raise ValidationError("Product not found.")
            
        quantity_before = product.quantity_available
        product.quantity_available += adjustment_amount
        
        if product.quantity_available < 0:
            raise ValidationError("Adjustment causes negative inventory.")
            
        product.save()
        quantity_after = product.quantity_available

        audit_logger.log(
            action='inventory.adjusted',
            actor_id=actor.id,
            actor_type=resolve_actor_type(actor),
            correlation_id=correlation_id,
            metadata={
                'product_id': str(product.id),
                'quantity_before': quantity_before,
                'quantity_after': quantity_after,
                'adjustment_amount': adjustment_amount,
                'reason': reason
            }
        )

        event_publisher.publish(
            event_name='inventory.adjusted',
            event_version=1,
            correlation_id=correlation_id,
            occurred_at=timezone.now(),
            producer='InventoryService',
            data={
                'product_id': str(product.id),
                'quantity_before': quantity_before,
                'quantity_after': quantity_after,
                'adjustment_amount': adjustment_amount,
                'reason': reason
            }
        )

        if quantity_after <= product.low_stock_threshold:
            InventoryService._emit_low_stock(actor, correlation_id, product)

    @staticmethod
    @transaction.atomic
    def update_threshold(actor, correlation_id, product_id, new_threshold):
        require_permission(actor, 'inventory.manage')
        product = Product.objects.select_for_update().filter(id=product_id).first()
        if not product:
            raise ValidationError("Product not found.")
            
        old_threshold = product.low_stock_threshold
        product.low_stock_threshold = new_threshold
        product.save()

        audit_logger.log(
            action='inventory.threshold_updated',
            actor_id=actor.id,
            actor_type=resolve_actor_type(actor),
            correlation_id=correlation_id,
            metadata={
                'product_id': str(product.id),
                'old_threshold': old_threshold,
                'new_threshold': new_threshold
            }
        )

    @staticmethod
    def _emit_low_stock(actor, correlation_id, product):
        audit_logger.log(
            action='inventory.low_stock',
            actor_id=actor.id,
            actor_type=resolve_actor_type(actor),
            correlation_id=correlation_id,
            metadata={
                'product_id': str(product.id),
                'quantity_available': product.quantity_available,
                'low_stock_threshold': product.low_stock_threshold
            }
        )
        event_publisher.publish(
            event_name='inventory.low_stock',
            event_version=1,
            correlation_id=correlation_id,
            occurred_at=timezone.now(),
            producer='InventoryService',
            data={
                'product_id': str(product.id),
                'quantity_available': product.quantity_available,
                'low_stock_threshold': product.low_stock_threshold
            }
        )
