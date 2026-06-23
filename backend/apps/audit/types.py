from typing import TypedDict, List

class ProductCreatedMetadata(TypedDict):
    product_id: str
    category_id: str
    sku: str

class ProductUpdatedMetadata(TypedDict):
    product_id: str
    changed_fields: List[str]

class ProductArchivedMetadata(TypedDict):
    product_id: str

class CategoryCreatedMetadata(TypedDict):
    category_id: str
    slug: str

class CategoryUpdatedMetadata(TypedDict):
    category_id: str
    changed_fields: List[str]

class CategoryArchivedMetadata(TypedDict):
    category_id: str

class InventoryReducedMetadata(TypedDict):
    products_affected: List[str]
    order_id: str
    quantity_before: int
    quantity_after: int
    quantity_reduced: int

class InventoryAdjustedMetadata(TypedDict):
    product_id: str
    quantity_before: int
    quantity_after: int
    adjustment_amount: int
    reason: str

class InventoryLowStockMetadata(TypedDict):
    product_id: str
    quantity_available: int
    low_stock_threshold: int

class OrderCreatedMetadata(TypedDict):
    order_id: str
    request_id: str
    customer_id: str
    total_amount: str

class OrderCancelledMetadata(TypedDict):
    order_id: str
    cancellation_reason: str

class OrderPaymentRequiredMetadata(TypedDict):
    order_id: str
    payment_id: str
    amount: str

class OrderFulfilledMetadata(TypedDict):
    order_id: str
    fulfilled_at: str

class PaymentInitializedMetadata(TypedDict):
    payment_id: str
    order_id: str
    amount: str
    currency: str
    paystack_reference: str

class PaymentPaidMetadata(TypedDict):
    order_id: str
    payment_id: str
    paystack_reference: str
    amount: str
    currency: str
    previous_state: str
    new_state: str

class PaymentFailedMetadata(TypedDict):
    payment_id: str
    order_id: str
    paystack_reference: str
    failure_reason: str

class PaymentCancelledMetadata(TypedDict):
    payment_id: str
    order_id: str

class PaymentExpiredMetadata(TypedDict):
    payment_id: str
    order_id: str

class WebhookReceivedMetadata(TypedDict):
    paystack_reference: str
    event_type: str

class WebhookRejectedMetadata(TypedDict):
    paystack_reference: str
    rejection_reason: str
