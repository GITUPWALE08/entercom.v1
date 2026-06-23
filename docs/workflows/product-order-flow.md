# product_order Workflow

## 1. Purpose
The purpose of this document is to define the complete, end-to-end workflow for product orders within the Entercom platform. It establishes the sequence of state transitions from customer intent to terminal fulfillment, ensuring financial integrity and inventory accuracy.

## 2. Scope
This workflow applies specifically to:
* Requests with the category `product_order`.
* Products belonging to an active ProductCategory.
* Orders requiring upfront payment via Payment Provider.

## 3. Out of Scope
* Technician assignment, scheduling, or booking creation.
* Quote workflow participation.
* Shipping, logistics, or warehouse picking.
* Refund system and post-payment cancellation.
* Notifications and WebSocket delivery (Phase 6).

## 4. Actors
* **Customer:** Initiates order and performs payment.
* **Staff:** Administers the physical fulfillment.
* **System:** Enforces stock rules, processes webhooks, and manages expirations.

## 5. Workflow Diagram
```text
[Customer] Create Request (product_order)
      ↓
[System] Validate Stock & Create Order
      ↓
[Customer] Initialize Payment
      ↓
[Payment Domain] Authoritative Webhook
      ↓
[Payment Domain] Update Payment to 'paid' & Emit payment.paid
      ↓
[Order Domain] Consume payment.paid -> Transition Order to 'Paid'
      ↓
[Order Domain] Call InventoryService.reduce_inventory()
      ↓
[Staff] Administrative Fulfillment
      ↓
[System] Terminal State: Fulfilled
```

## 6. Detailed Steps

### Step 1: Request Initiation
* **Actor:** Customer.
* **Action:** Submits a `product_order` Request.
* **Rule:** System performs a **Hard Stock Check**. If `quantity_available` is insufficient, the request is rejected immediately. No backorders or waitlists.

### Step 2: Order Generation
* **Actor:** System.
* **Action:** Creates an Order linked 1:1 to the Request.
* **Snapshot Rule:** System captures `unit_price` and `line_total` as immutable snapshots on `OrderItems`.

### Step 3: Payment Initialization
* **Actor:** Customer.
* **Action:** Initiates Payment Provider transaction.
* **Order State:** `pending_payment`.

### Step 4: Authoritative Verification
* **Actor:** System (Webhook).
* **Action:** Receives and verifies Payment Provider notification.
* **Rule:** Webhook is the only canonical truth. Frontend signals are ignored for state changes.

### Step 5: Depletion & Paid Transition
* **Actor:** PaymentService & OrderService.
* **Action:**
    1. Webhook processing updates Payment to `paid` and emits `payment.paid`.
    2. OrderService consumes `payment.paid` and transitions Order to `Paid`.
    3. OrderService calls `InventoryService.reduce_inventory()`. PaymentService MUST NOT directly mutate Order state.
* **Exception:** If stock became insufficient during the payment window, fulfillment is blocked and requires Manager intervention.

### Step 6: Fulfillment
* **Actor:** Staff.
* **Action:** Physically processes order and marks as `Fulfilled`.
* **Prerequisite:** Order MUST be in `Paid` state.

## 7. Cancellation & Expiration

### 7.1 Manual Cancellation
* **Status `pending_payment`:** Cancellable by Customer, Staff, or Manager.
* **Status `paid`:** NOT cancellable. No refund workflow exists in Phase 5.

### 7.2 Automatic Expiration
* **Trigger:** Background job at T+24 hours after creation.
* **Action:** System transitions Payment, Order, and Request to `cancelled`.

## 8. Integration Hooks (Events)
The workflow emits the following domain events for forensic audit and future integration:
* `order.created`
* `order.paid`
* `order.cancelled`
* `order.fulfilled`
* `blackout.created` / `blackout.deleted` (if applicable to catalog changes)

## 9. Completion Criteria
* No inventory is reduced without verified payment success.
* Product orders move through the lifecycle independently of the dispatch/technician domain.
* Pricing snapshots preserve the financial integrity of the order.
* Expiration policy prevents indefinite pending states.
