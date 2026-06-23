from enum import Enum

class AuditAction(Enum):
    # Product
    PRODUCT_CREATED = 'product.created'
    PRODUCT_UPDATED = 'product.updated'
    PRODUCT_ARCHIVED = 'product.archived'
    CATEGORY_CREATED = 'category.created'
    CATEGORY_UPDATED = 'category.updated'
    CATEGORY_ARCHIVED = 'category.archived'
    INVENTORY_REDUCED = 'inventory.reduced'
    INVENTORY_ADJUSTED = 'inventory.adjusted'
    INVENTORY_LOW_STOCK = 'inventory.low_stock'

    # Order
    ORDER_CREATED = 'order.created'
    ORDER_CANCELLED = 'order.cancelled'
    ORDER_FULFILLED = 'order.fulfilled'
    ORDER_PAYMENT_REQUIRED = 'order.payment_required'

    # Payment
    PAYMENT_INITIALIZED = 'payment.initialized'
    PAYMENT_PAID = 'payment.paid'
    PAYMENT_FAILED = 'payment.failed'
    PAYMENT_CANCELLED = 'payment.cancelled'
    PAYMENT_EXPIRED = 'payment.expired'
    WEBHOOK_RECEIVED = 'webhook.received'
    WEBHOOK_REJECTED = 'webhook.rejected'

class ActorType(Enum):
    CUSTOMER = 'CUSTOMER'
    STAFF = 'STAFF'
    MANAGER = 'MANAGER'
    SUPERADMIN = 'SUPERADMIN'
    SYSTEM = 'SYSTEM'
    WEBHOOK = 'WEBHOOK'
