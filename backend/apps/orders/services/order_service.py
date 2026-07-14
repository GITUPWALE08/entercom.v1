from django.db import transaction
from django.core.exceptions import ValidationError
from django.utils import timezone
from apps.orders.models import Order, OrderItem, OrderStatus
from apps.products.models import Product
from apps.products.services.inventory_service import InventoryService
from core.events import event_publisher
from apps.audit.services import AuditService as audit_logger, resolve_actor_type
from core.permissions import require_permission

class OrderService:
    """
    Consolidated orchestrator for the entire Order lifecycle.
    """
    @staticmethod
    @transaction.atomic
    def create_order(actor, correlation_id, request_id, customer_id, items_data):
        require_permission(actor, 'order.create')
        
        if Order.objects.filter(request_id=request_id).exists():
            raise ValidationError("Order for this request already exists.")
            
        total_amount = 0
        order_items = []
        
        product_ids = [item['product_id'] for item in items_data]
        products = {str(p.id): p for p in Product.objects.filter(id__in=product_ids)}
        
        order = Order.objects.create(
            request_id=request_id,
            customer_id=customer_id,
            status=OrderStatus.CREATED,
            total_amount=0
        )
        
        for item in items_data:
            pid = str(item['product_id'])
            if pid not in products:
                raise ValidationError(f"Product {pid} not found.")
            product = products[pid]
            if product.status == 'archived':
                raise ValidationError(f"Product {pid} is archived and cannot be ordered.")
            quantity = item['quantity']
            
            if quantity <= 0:
                raise ValidationError("Quantity must be greater than zero.")
                
            line_total = product.unit_price * quantity
            total_amount += line_total
            
            order_items.append(
                OrderItem(
                    order=order,
                    product_id=product.id,
                    quantity=quantity,
                    product_name_snapshot=product.name,
                    unit_price_snapshot=product.unit_price,
                    line_total_snapshot=line_total
                )
            )
            
        OrderItem.objects.bulk_create(order_items)
        order.total_amount = total_amount
        order.save()
        
        audit_logger.log(
            action='order.created',
            actor_id=actor.id,
            actor_type=resolve_actor_type(actor),
            correlation_id=correlation_id,
            metadata={
                'order_id': str(order.id),
                'request_id': str(order.request_id),
                'customer_id': str(order.customer_id),
                'total_amount': str(order.total_amount)
            }
        )

        event_publisher.publish(
            event_name='order.created',
            event_version=1,
            correlation_id=correlation_id,
            occurred_at=timezone.now(),
            producer='OrderService',
            data={
                'order_id': str(order.id),
                'request_id': str(order.request_id),
                'customer_id': str(order.customer_id),
                'total_amount': float(order.total_amount)
            }
        )
        return order

    @staticmethod
    @transaction.atomic
    def create_order_from_quote(actor, correlation_id, request_id, customer_id, quote_amount):
        if Order.objects.filter(request_id=request_id).exists():
            return Order.objects.get(request_id=request_id)
            
        order = Order.objects.create(
            request_id=request_id,
            customer_id=customer_id,
            status=OrderStatus.PENDING_PAYMENT,
            total_amount=quote_amount
        )
        
        audit_logger.log(
            action='order.created_from_quote',
            actor_id=actor.id,
            actor_type=resolve_actor_type(actor),
            correlation_id=correlation_id,
            metadata={
                'order_id': str(order.id),
                'request_id': str(order.request_id),
                'total_amount': str(order.total_amount)
            }
        )

        event_publisher.publish(
            event_name='order.created',
            event_version=1,
            correlation_id=correlation_id,
            occurred_at=timezone.now(),
            producer='OrderService',
            data={
                'order_id': str(order.id),
                'request_id': str(order.request_id),
                'customer_id': str(order.customer_id),
                'total_amount': float(order.total_amount)
            }
        )
        return order

    @staticmethod
    @transaction.atomic
    def require_payment(actor, correlation_id, order_id, payment_id, amount):
        order = Order.objects.select_for_update().filter(id=order_id).first()
        if not order:
            raise ValidationError("Order not found.")
        order.status = OrderStatus.PENDING_PAYMENT
        order.save()
        
        audit_logger.log(
            action='order.payment_required',
            actor_id=actor.id,
            actor_type=resolve_actor_type(actor),
            correlation_id=correlation_id,
            metadata={
                'order_id': str(order.id),
                'payment_id': str(payment_id),
                'amount': str(amount)
            }
        )

    @staticmethod
    @transaction.atomic
    def process_payment_paid_event(actor, correlation_id, order_id):
        order = Order.objects.select_for_update().filter(id=order_id).first()
        if not order:
            raise ValidationError("Order not found.")
            
        if order.status != OrderStatus.PENDING_PAYMENT and order.status != OrderStatus.CREATED:
            raise ValidationError("Order is not in a payable state.")
            
        order.status = OrderStatus.PAID
        order.save()
        
        reductions = [{'product_id': str(item.product_id), 'quantity': item.quantity} for item in order.items.all()]
        InventoryService.reduce_inventory(actor, correlation_id, order.id, reductions)
        
        from apps.requests.services.request_process_orchestrator import RequestProcessOrchestrator
        try:
            RequestProcessOrchestrator.sync(order.request_id)
        except Exception as e:
            import logging
            logging.getLogger(__name__).error(f"Failed to sync request {order.request_id}: {str(e)}")

    @staticmethod
    @transaction.atomic
    def cancel_order(actor, correlation_id, order_id, cancellation_reason):
        require_permission(actor, 'order.cancel')
        order = Order.objects.select_for_update().filter(id=order_id).first()
        if not order:
            raise ValidationError("Order not found.")
            
        if order.status == OrderStatus.PAID and cancellation_reason != "Payment was refunded":
            raise ValidationError("Paid orders cannot be cancelled unless payment is refunded.")
            
        previous_status = order.status
        order.status = OrderStatus.CANCELLED
        order.save()
        
        if previous_status == OrderStatus.PAID:
            for item in order.items.all():
                InventoryService.adjust_inventory(
                    actor=actor,
                    correlation_id=correlation_id,
                    product_id=item.product_id,
                    adjustment_amount=item.quantity,
                    reason="Order cancelled due to refund"
                )
        
        audit_logger.log(
            action='order.cancelled',
            actor_id=actor.id,
            actor_type=resolve_actor_type(actor),
            correlation_id=correlation_id,
            metadata={
                'order_id': str(order.id),
                'cancellation_reason': cancellation_reason
            }
        )

        event_publisher.publish(
            event_name='order.cancelled',
            event_version=1,
            correlation_id=correlation_id,
            occurred_at=timezone.now(),
            producer='OrderService',
            data={
                'order_id': str(order.id),
                'cancellation_reason': cancellation_reason
            }
        )

        from apps.requests.services.request_process_orchestrator import RequestProcessOrchestrator
        try:
            RequestProcessOrchestrator.sync(order.request_id)
        except Exception as e:
            import logging
            logging.getLogger(__name__).error(f"Failed to sync request {order.request_id} on order cancellation: {str(e)}")

        return order

    @staticmethod
    @transaction.atomic
    def fulfill_order(actor, correlation_id, order_id):
        require_permission(actor, 'order.fulfill')
        order = Order.objects.select_for_update().filter(id=order_id).first()
        if not order:
            raise ValidationError("Order not found.")
            
        if order.status == OrderStatus.FULFILLED:
            return order
            
        if order.status != OrderStatus.PAID:
            raise ValidationError("Order must be paid before fulfillment.")
            
        order.status = OrderStatus.FULFILLED
        order.save()
        
        audit_logger.log(
            action='order.fulfilled',
            actor_id=actor.id,
            actor_type=resolve_actor_type(actor),
            correlation_id=correlation_id,
            metadata={
                'order_id': str(order.id),
                'fulfilled_at': timezone.now().isoformat() + "Z"
            }
        )

        event_publisher.publish(
            event_name='order.fulfilled',
            event_version=1,
            correlation_id=correlation_id,
            occurred_at=timezone.now(),
            producer='OrderService',
            data={
                'order_id': str(order.id)
            }
        )
        
        from apps.requests.services.request_process_orchestrator import RequestProcessOrchestrator
        try:
            RequestProcessOrchestrator.sync(order.request_id)
        except Exception as e:
            import logging
            logging.getLogger(__name__).error(f"Failed to sync request {order.request_id} on fulfillment: {str(e)}")

        return order
