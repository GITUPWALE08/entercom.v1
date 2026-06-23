from apps.common.events.base import EventEnvelope
from apps.common.events.publisher import EventPublisher
from typing import List

PRODUCER = 'ProductService'
CATEGORY_PRODUCER = 'CategoryService'
INVENTORY_PRODUCER = 'InventoryService'

class ProductEvents:
    @staticmethod
    def product_created(correlation_id: str, product_id, category_id, name: str, sku: str, price, quantity_available: int, low_stock_threshold: int, status: str):
        event = EventEnvelope.create(
            event_name="product.created",
            correlation_id=correlation_id,
            producer=PRODUCER,
            data={
                "product_id": str(product_id),
                "category_id": str(category_id),
                "name": name,
                "sku": sku,
                "price": str(price),
                "quantity_available": quantity_available,
                "low_stock_threshold": low_stock_threshold,
                "status": status
            }
        )
        EventPublisher.publish(event)

    @staticmethod
    def product_updated(correlation_id: str, product_id, changed_fields: List[str]):
        event = EventEnvelope.create(
            event_name="product.updated",
            correlation_id=correlation_id,
            producer=PRODUCER,
            data={
                "product_id": str(product_id),
                "changed_fields": changed_fields
            }
        )
        EventPublisher.publish(event)

    @staticmethod
    def product_archived(correlation_id: str, product_id):
        event = EventEnvelope.create(
            event_name="product.archived",
            correlation_id=correlation_id,
            producer=PRODUCER,
            data={
                "product_id": str(product_id)
            }
        )
        EventPublisher.publish(event)

class CategoryEvents:
    @staticmethod
    def category_created(correlation_id: str, category_id, name: str, slug: str):
        event = EventEnvelope.create(
            event_name="category.created",
            correlation_id=correlation_id,
            producer=CATEGORY_PRODUCER,
            data={
                "category_id": str(category_id),
                "name": name,
                "slug": slug
            }
        )
        EventPublisher.publish(event)

    @staticmethod
    def category_updated(correlation_id: str, category_id, changed_fields: List[str]):
        event = EventEnvelope.create(
            event_name="category.updated",
            correlation_id=correlation_id,
            producer=CATEGORY_PRODUCER,
            data={
                "category_id": str(category_id),
                "changed_fields": changed_fields
            }
        )
        EventPublisher.publish(event)

    @staticmethod
    def category_archived(correlation_id: str, category_id):
        event = EventEnvelope.create(
            event_name="category.archived",
            correlation_id=correlation_id,
            producer=CATEGORY_PRODUCER,
            data={
                "category_id": str(category_id)
            }
        )
        EventPublisher.publish(event)

class InventoryEvents:
    @staticmethod
    def inventory_reduced(correlation_id: str, product_id, order_id, quantity_before: int, quantity_after: int, quantity_reduced: int):
        event = EventEnvelope.create(
            event_name="inventory.reduced",
            correlation_id=correlation_id,
            producer=INVENTORY_PRODUCER,
            data={
                "product_id": str(product_id),
                "order_id": str(order_id),
                "quantity_before": quantity_before,
                "quantity_after": quantity_after,
                "quantity_reduced": quantity_reduced
            }
        )
        EventPublisher.publish(event)

    @staticmethod
    def inventory_adjusted(correlation_id: str, product_id, quantity_before: int, quantity_after: int, adjustment_amount: int, reason: str):
        event = EventEnvelope.create(
            event_name="inventory.adjusted",
            correlation_id=correlation_id,
            producer=INVENTORY_PRODUCER,
            data={
                "product_id": str(product_id),
                "quantity_before": quantity_before,
                "quantity_after": quantity_after,
                "adjustment_amount": adjustment_amount,
                "reason": reason
            }
        )
        EventPublisher.publish(event)

    @staticmethod
    def inventory_low_stock(correlation_id: str, product_id, quantity_available: int, low_stock_threshold: int):
        event = EventEnvelope.create(
            event_name="inventory.low_stock",
            correlation_id=correlation_id,
            producer=INVENTORY_PRODUCER,
            data={
                "product_id": str(product_id),
                "quantity_available": quantity_available,
                "low_stock_threshold": low_stock_threshold
            }
        )
        EventPublisher.publish(event)
