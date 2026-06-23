import os
import re

def update_file(path, old, new):
    if not os.path.exists(path): return
    with open(path, "r", encoding="utf-8") as f:
        content = f.read()
    content = content.replace(old, new)
    with open(path, "w", encoding="utf-8") as f:
        f.write(content)

def regex_replace(path, pattern, replacement):
    if not os.path.exists(path): return
    with open(path, "r", encoding="utf-8") as f:
        content = f.read()
    content = re.sub(pattern, replacement, content)
    with open(path, "w", encoding="utf-8") as f:
        f.write(content)

# 1. Product Domain
update_file('docs/architecture/orders/product-domain.md',
'2. **Archived:** Not visible; cannot be added to new orders. Persists for historical integrity.',
'2. **Archived:** Visible to Customers for historical reference, but cannot be added to new orders. Persists for historical integrity.')
update_file('docs/architecture/orders/product-domain.md',
'2. **Inactive:** Hidden; products remain but are not discoverable via the category.',
'2. **Inactive:** Hidden; products remain but are not discoverable via the category. Archiving a Category automatically archives all Products in that Category.')

# 2. Order Domain
update_file('docs/architecture/orders/order-domain.md',
'## 5. Domain Boundaries & Relationships',
'## 5. Domain Boundaries & Relationships\n* **Request Lifecycle Ownership:** The Request Domain NEVER owns inventory, payment, or fulfillment. The Order Domain owns inventory interaction, payment interaction, and fulfillment.')
regex_replace('docs/architecture/orders/order-domain.md',
r'\* \*\*Stock Depletion Rule:\*\* Inventory is NOT reserved at creation\. Inventory reduction occurs atomically within the payment success transaction\.',
'* **Stock Depletion Rule:** Inventory is NOT reserved at creation. Inventory reduction is orchestrated by OrderService calling InventoryService.reduce_inventory() after consuming the payment.paid event.')

# 3. Payment Domain
update_file('docs/architecture/payment/payment-domain.md',
'2. **Success:** Terminal state. Verified webhook confirms full settlement. Triggers `Order.Paid` transition.',
'2. **Paid:** Terminal state. Verified webhook confirms full settlement. Emits payment.paid event.')
regex_replace('docs/architecture/payment/payment-domain.md', r'\bpayment\.success\b', 'payment.paid')
update_file('docs/architecture/payment/payment-domain.md', '| `pending` | `success` |', '| `pending` | `paid` |')
update_file('docs/architecture/payment/payment-domain.md',
'* **Failure Handling:** A `failed` state allows the Customer to re-initiate payment against the same Order until the expiration window closes.',
'* **Failure Handling:** A `failed` state allows the Customer to re-initiate payment against the same Order until the expiration window closes. Retries use the SAME Payment record, but a new paystack_reference is generated. No new Payment object is created.')
update_file('docs/architecture/payment/payment-domain.md',
'* **24-Hour Expiration:** Executed by a background job.',
'* **24-Hour Expiration:** Payment expiry ownership belongs exclusively to a Background Job. Expiry is not user initiated.')

# 4. Product Services
update_file('docs/architecture/orders/product-services.md',
'* **Manage Product Media:** Handle pointers for up to 4 images per product.',
'* **Manage Product Media:** ProductService owns image count validation and enforces the maximum 4 images per product rule.')
update_file('docs/architecture/orders/product-services.md',
'* **Archive Category:** Mark categories as inactive.',
'* **Archive Category:** Mark categories as inactive. Archiving a category automatically archives all products within it.')
update_file('docs/architecture/orders/product-services.md',
'* **Reduce Inventory:** Atomically decrement `quantity_available` upon payment confirmation.',
'* **Reduce Inventory:** Atomically decrement `quantity_available`. InventoryService.reduce_inventory() is called exclusively by OrderService.')
update_file('docs/architecture/orders/product-services.md',
'* **The "Paid" Rule:** **Inventory reduction occurs ONLY after a payment reaches the `paid` state.** No service is authorized to reduce inventory before successful authoritative settlement.',
'* **The "Paid" Rule:** **Inventory reduction occurs ONLY after a payment reaches the `paid` state.** OrderService orchestrates this by calling InventoryService.reduce_inventory().')

# 5. Order Services
update_file('docs/architecture/orders/order-services.md',
'* **Cancel Pending Order:** Terminate an order that has not yet reached the `paid` state.',
'* **Cancel Pending Order:** Terminate an order that has not yet reached the `paid` state. OrderService.cancel_order() is the sole producer of order.cancelled.')
update_file('docs/architecture/orders/order-services.md',
'Services emit events to signal state transitions, particularly for the Payment and Inventory domains to consume (e.g., triggering stock reduction upon the `order.paid` transition).',
'Services emit events to signal state transitions. OrderService consumes the `payment.paid` event, updates the Order state, and orchestrates stock reduction by calling InventoryService.reduce_inventory(). PaymentService MUST NOT directly mutate Order state.')

# 6. Payment Services
update_file('docs/architecture/payment/payment-services.md',
'* **Expire Payments:** Background logic to transition records to `cancelled` if not settled within 24 hours.',
'* **Expire Payments:** Background Job is the sole producer for payment expiry. Expiry is not user initiated.')
update_file('docs/architecture/payment/payment-services.md',
'* **Verify Signature:** Validate the HMAC-SHA512 header using the shared secret key.',
'* **Verify Signature:** Validate the HMAC-SHA512 header using the shared secret key. Invalid or rejected webhooks result in the Payment transitioning to failed.')
update_file('docs/architecture/payment/payment-services.md',
'* **Update Payment:** Transition the Payment record to `paid` or `failed`.\n    * **Update Order:** Trigger the transition of the related Order aggregate to the `Paid` state.\n    * **Trigger Inventory Reduction:** Coordinate with InventoryService to deplete stock upon successful settlement.',
'* **Update Payment:** Transition the Payment record to `paid` or `failed`.\n    * **Emit Event:** Emit payment.paid event. WebhookService MUST NOT directly mutate Order state or trigger Inventory Reduction.')
regex_replace('docs/architecture/payment/payment-services.md', r'\bpayment\.success\b', 'payment.paid')

# 7. Product Events
update_file('docs/architecture/orders/product-events.md',
'* **Notification Layer (Phase 6):** Future consumer for low-stock alerts.',
'* **Notification Service (Future):** Sole consumer for inventory.low_stock events.')

# 8. Order Events
update_file('docs/architecture/orders/order-events.md',
'| `order.cancelled`| Notify that a non-terminal order was terminated. | Manual actor action or 24-hour expiration. | `OrderService` |',
'| `order.cancelled`| Notify that a non-terminal order was terminated. | Manual actor action or 24-hour expiration. | `OrderService.cancel_order()` (Sole Producer) |')

# 9. Payment Events
update_file('docs/architecture/payment/payment-events.md',
'| `payment.paid` | Notify that settlement is complete. | Verified Success Webhook. | `WebhookService` |',
'| `payment.paid` | Notify that settlement is complete. | Verified Webhook. | `WebhookService` |')
update_file('docs/architecture/payment/payment-events.md',
'| `webhook.rejected` | Forensic record of invalid provider attempts. | HMAC/Idempotency failure. | `WebhookService` |',
'| `webhook.rejected` | Forensic record of invalid provider attempts. Results in payment.failed. | HMAC/Idempotency failure. | `WebhookService` |')

# 10. Product Permissions
update_file('docs/architecture/orders/product-permissions.md',
'* **Restrictions:** Archived products/categories are hidden from Customers. Staff+ can view archived items.',
'* **Restrictions:** Archived products ARE visible to Customers, but cannot be added to orders. Frontend may optionally hide them.')

# 11. Order Permissions
update_file('docs/architecture/orders/order-permissions.md',
'* **Restrictions:** Fails if requested stock is unavailable.',
'* **Restrictions:** Fails if requested stock is unavailable or if the product is archived.')

# 12. Payment Permissions
update_file('docs/architecture/payment/payment-permissions.md',
'* Only the verified **Paystack Webhook Processor** holds authority for this transition.',
'* Only the verified **Paystack Webhook Processor** holds authority for this transition. Invalid or rejected webhooks transition the payment to failed.')

# 13. Product Auditing
update_file('docs/architecture/orders/product-auditing.md',
'* **Inventory Reduction (`inventory.reduced`):** This is a strict **financial side effect** of a successful payment. It MUST always be auditable and MUST preserve the `correlation_id` of the parent `order.paid` transition.',
'* **Inventory Reduction (`inventory.reduced`):** This is a strict **financial side effect** orchestrated by OrderService after consuming payment.paid. It MUST always be auditable and MUST preserve the `correlation_id`.')

# 14. Payment Auditing
regex_replace('docs/architecture/payment/payment-auditing.md', r'\bpayment\.success\b', 'payment.paid')
update_file('docs/architecture/payment/payment-auditing.md',
'* **Trigger:** Invalid signature, invalid payload, failed verification, or duplicate event rejection.',
'* **Trigger:** Invalid signature, invalid payload, failed verification. (Invalid/rejected webhooks result in payment.failed).')

# 15. Product Order Flow
update_file('docs/workflows/product-order-flow.md',
"[Payment Domain] Authoritative Webhook\n      ↓\n[System] Atomic Transaction: \n         - Update Payment to 'paid'\n         - Update Order to 'Paid'\n         - Reduce Product Inventory",
"[Payment Domain] Authoritative Webhook\n      ↓\n[Payment Domain] Update Payment to 'paid' & Emit payment.paid\n      ↓\n[Order Domain] Consume payment.paid -> Transition Order to 'Paid'\n      ↓\n[Order Domain] Call InventoryService.reduce_inventory()")
update_file('docs/workflows/product-order-flow.md',
'### Step 5: Depletion & Paid Transition\n* **Actor:** System.\n* **Action:** Within a single atomic transaction:\n    1. Transition Order to `Paid`.\n    2. Reduce `quantity_available` for all related products.',
'### Step 5: Depletion & Paid Transition\n* **Actor:** PaymentService & OrderService.\n* **Action:**\n    1. Webhook processing updates Payment to `paid` and emits `payment.paid`.\n    2. OrderService consumes `payment.paid` and transitions Order to `Paid`.\n    3. OrderService calls `InventoryService.reduce_inventory()`. PaymentService MUST NOT directly mutate Order state.')

# 16. Payment Lifecycle
update_file('docs/workflows/payment-lifecycle.md',
'| `pending` | `paid` | Webhook (Success) | Verified server-to-server data only. |',
'| `pending` | `paid` | Webhook | Verified server-to-server data only. |')
update_file('docs/workflows/payment-lifecycle.md',
'* The Customer may retry the payment, which returns the state to `pending`.',
'* The Customer may retry the payment. This uses the SAME Payment record, but generates a new `paystack_reference`. No new Payment object is created.')
update_file('docs/workflows/payment-lifecycle.md',
'* A background job executes the expiration policy exactly 24 hours after creation.',
'* A Background Job is the sole producer of payment expiration. Expiration is not user-initiated.')

# 17. Paystack Webhook Flow
update_file('docs/workflows/paystack-webhook-flow.md',
"[Database] Open Atomic Transaction\n      ↓\n[Payment Domain] Transition Payment to 'paid'\n      ↓\n[Order Domain] Transition Order to 'Paid'\n      ↓\n[Product Domain] Reduce quantity_available\n      ↓\n[Database] Commit Transaction",
"[Database] Open Atomic Transaction\n      ↓\n[Payment Domain] Transition Payment to 'paid' or 'failed'\n      ↓\n[Database] Commit Transaction\n      ↓\n[System] Emit payment.paid or payment.failed\n      ↓\n[Order Domain] Consumes event and manages Order/Inventory")
update_file('docs/workflows/paystack-webhook-flow.md',
'* **Action:** Within a single `@transaction.atomic` block:\n    1. **Update States:** Transition Payment to `paid` and Order to `Paid`.\n    2. **Reduce Inventory:** Decrement `quantity_available` for all related products.\n    3. **Emit Events:** Generate domain events for successful settlement.',
'* **Action:** Within a single `@transaction.atomic` block:\n    1. **Update Payment:** Transition Payment to `paid` or `failed`. (Invalid webhooks result in `failed`).\n    2. **Emit Events:** Generate `payment.paid` or `payment.failed`. PaymentService MUST NOT directly mutate Order state or trigger Inventory Reduction.')
update_file('docs/workflows/paystack-webhook-flow.md',
'* **Rule:** If signature is invalid, drop request immediately with HTTP 401.',
'* **Rule:** If signature is invalid, the webhook is rejected and the Payment transitions to `failed`.')

def global_terminology_standardization(path):
    if not os.path.exists(path): return
    with open(path, "r", encoding="utf-8") as f:
        content = f.read()
    content = re.sub(r"\bProduct Order\b", "product_order", content)
    content = re.sub(r"\bproduct order\b", "product_order", content)
    content = re.sub(r"\bproduct-order\b", "product_order", content)
    content = re.sub(r"\bPaystack Reference\b", "paystack_reference", content)
    content = re.sub(r"\bpaystack reference\b", "paystack_reference", content)
    content = re.sub(r"\bTransaction Reference\b", "paystack_reference", content)
    content = re.sub(r"\btransaction reference\b", "paystack_reference", content)
    with open(path, "w", encoding="utf-8") as f:
        f.write(content)

files = [
    "docs/architecture/orders/product-domain.md",
    "docs/architecture/orders/order-domain.md",
    "docs/architecture/payment/payment-domain.md",
    "docs/architecture/orders/product-services.md",
    "docs/architecture/orders/order-services.md",
    "docs/architecture/payment/payment-services.md",
    "docs/architecture/orders/product-events.md",
    "docs/architecture/orders/order-events.md",
    "docs/architecture/payment/payment-events.md",
    "docs/architecture/orders/product-permissions.md",
    "docs/architecture/orders/order-permissions.md",
    "docs/architecture/payment/payment-permissions.md",
    "docs/architecture/orders/product-auditing.md",
    "docs/architecture/orders/order-auditing.md",
    "docs/architecture/payment/payment-auditing.md",
    "docs/workflows/product-order-flow.md",
    "docs/workflows/payment-lifecycle.md",
    "docs/workflows/paystack-webhook-flow.md"
]

for f in files:
    global_terminology_standardization(f)
