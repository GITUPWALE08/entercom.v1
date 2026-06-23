# Order Service Implementation Design

## 1. Purpose
The purpose of this document is to define the concrete implementation responsibilities, transaction boundaries, and event orchestration for the Order Domain services. It establishes the strict rules governing order lifecycles, pricing snapshots, and administrative fulfillment.

## 2. Scope
This document covers:
* `OrderService`
* `OrderItemService`
* `FulfillmentService`

## 3. Out of Scope
* Django ORM code generation.
* Payment processing or webhook handling.
* Inventory math or stock adjustments.

## 4. Dependencies
* **Order Domain Architecture**
* **Order Model Design**
* **Order Permissions Architecture**
* **Order Events Architecture**
* **Order Auditing Architecture**

## 5. Service Inventory

### 5.1 OrderService
* **Purpose:** Orchestrator for the Order lifecycle and final financial totals.
* **Ownership:** Order entity state, `total_amount` calculations, cancellation logic, and inventory reduction orchestration.
* **Consumers:** API Views, Event Listeners (consuming `payment.paid`).
* **Dependencies:** OrderItemService, ProductService (via OrderItemService), InventoryService.

### 5.2 OrderItemService
* **Purpose:** Manager for line items and immutable pricing snapshots.
* **Ownership:** OrderItem entities.
* **Consumers:** OrderService.
* **Dependencies:** ProductService (for initial price lookup).

### 5.3 FulfillmentService
* **Purpose:** Administrative processor for settled orders.
* **Ownership:** Fulfillment lifecycle actions.
* **Consumers:** API Views.
* **Dependencies:** OrderService.

## 6. Responsibilities & Ownership Rules

### 6.1 OrderService
* **Owns:** Order creation (1:1 with Request), Order cancellation (only if `pending_payment`), calculating `total_amount`, transitioning Order state to `Paid` (by consuming `payment.paid`), and calling `InventoryService.reduce_inventory()`.
* **Does NOT Own:** Payment references, Payment Provider communication, inventory calculations, or technician assignment.

### 6.2 OrderItemService
* **Owns:** Creating OrderItems, fetching current Product price, taking immutable price snapshots, and calculating line totals.
* **Does NOT Own:** Modifying snapshots after creation, Order state transitions.

### 6.3 FulfillmentService
* **Owns:** Transitioning a `Paid` order to `Fulfilled`.
* **Does NOT Own:** Customer interactions, scheduling, bookings, or stock reduction.

## 7. Operation Specifications

### 7.1 Order Creation (OrderService)
* **Transaction Required:** Yes.
* **Why:** Atomic creation of Order and multiple OrderItems.
* **Atomicity Requirements:** Must lock Request to prevent multi-order creation. Must query `InventoryService.validate_stock()` synchronously.
* **Permission Enforcement:** `order.create`. Restricted to Customers.
* **Audit Actions:** `order.created`. Captures `actor_id` and `request_id`.
* **Event Emission:** `order.created`. Emitted `on_commit`.

### 7.2 Order Cancellation (OrderService)
* **Transaction Required:** Yes.
* **Why:** Prevents race conditions with incoming payment webhooks.
* **Permission Enforcement:** `order.cancel`. Customer (own), Manager, Superadmin.
* **Validation Responsibility:** Service must verify order is in `pending_payment` state. `Paid` orders are strictly rejected.
* **Audit Actions:** `order.cancelled`. Captures `reason` and state delta.
* **Event Emission:** `order.cancelled`. Emitted `on_commit`.

### 7.3 Payment Success Handling (OrderService)
* **Transaction Required:** Yes.
* **Why:** Must atomically update Order state to `Paid` and reduce inventory.
* **Permission Enforcement:** System-owned action (triggered by event listener).
* **Operation Logic:** Consumes `payment.paid` event -> Updates Order state -> Calls `InventoryService.reduce_inventory()`.
* **Audit Actions:** Handled by Order state update and InventoryService.
* **Event Emission:** None directly from this method (Order transition emits internal signal, Inventory emits its own).

### 7.4 Fulfillment (FulfillmentService)
* **Transaction Required:** Yes.
* **Why:** State transition consistency.
* **Permission Enforcement:** `order.fulfill`, `order.override_fulfillment`. Restricted to Staff+.
* **Validation Responsibility:** Order MUST be in `paid` state.
* **Audit Actions:** `order.fulfilled`. Captures acting staff member.
* **Event Emission:** `order.fulfilled`. Emitted `on_commit`.

## 8. Cross-Service Interaction Matrix
* `OrderService` → calls → `OrderItemService` (To populate line items).
* `OrderItemService` → calls → `ProductService` (To retrieve current price).
* `OrderService` → calls → `InventoryService` (To validate stock during creation and reduce stock during payment success).

## 9. Forbidden Interactions
* `OrderService` MUST NOT update Payment states.
* `FulfillmentService` MUST NOT operate on `pending_payment` orders.
* `Request Domain` MUST NOT invoke `FulfillmentService`.

## 10. Failure Handling
* **Validation Failure:** Attempting to cancel a `paid` order raises a strict exception.
* **Concurrency Failure:** Concurrent creation requests for the same `request_id` will fail on the database unique constraint constraint.
* **Stock Race Failure:** If inventory becomes insufficient between order creation and payment completion, `OrderService` blocks fulfillment and flags for administrative intervention.

## 11. Open Questions
No unresolved service-layer questions remain.

## 12. Completion Criteria
* Service explicitly enforces 1:1 mapping between Request and Order.
* Pricing snapshot immutability is strictly encapsulated within OrderItemService.
* OrderService is established as the sole orchestrator of inventory reduction following a payment event.
* Cancellation logic strictly respects the `pending_payment` boundary.
