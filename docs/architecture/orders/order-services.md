# Order Service Architecture

## 1. Purpose
The purpose of this document is to define the logical service boundaries and responsibilities for managing Orders, Order Items, and Fulfillment within the Entercom platform. It ensures that the financial representation of customer requests is handled with strict consistency, immutability, and administrative oversight.

## 2. Scope
This document covers:
* **OrderService:** Lifecycle management and total value calculations for the Order aggregate.
* **OrderItemService:** Granular management of line items and authoritative price snapshots.
* **FulfillmentService:** Administrative processing of settled orders.

## 3. Out of Scope
* Payment integration and webhook processing (covered in Payment Services).
* Catalog management and inventory tracking (covered in Product Services).
* Shipping, logistics, or multi-warehouse orchestration.
* Technician scheduling or field service dispatch.

## 4. Definitions
* **Pricing Snapshot:** The authoritative and immutable record of a product's price at the exact moment of order creation.
* **Administrative Fulfillment:** The manual process performed by Staff to mark an order as processed/handed over without technician participation.
* **Aggregate Totals:** The derived sum of all line item totals, calculated once and preserved within the Order entity.

## 5. Service Inventory

### 5.1 OrderService
* **Purpose:** Orchestrates the high-level lifecycle and state of a financial Order.
* **Responsibilities:**
    * **Create Order:** Initialize the Order aggregate linked 1:1 to a `product_order` Request.
    * **Cancel Pending Order:** Terminate an order that has not yet reached the `paid` state. OrderService.cancel_order() is the sole producer of order.cancelled.
    * **Maintain Order Lifecycle:** Govern transitions through `created`, `pending_payment`, `paid`, `fulfilled`, and `cancelled`. Only OrderService may transition an Order into fulfilled.
    * **Calculate Totals:** Aggregate line item values to produce the final order amount.
* **Inputs:** Request ID, List of Products/Quantities, Actor ID.
* **Outputs:** Order aggregate state.
* **Events Produced:** `order.created`, `order.cancelled`, `order.paid_transition_acknowledged`.

### 5.2 OrderItemService
* **Purpose:** Manages the constituent parts of an order, ensuring financial forensic integrity.
* **Responsibilities:**
    * **Create Order Items:** Instantiate line items subordinate to an Order.
    * **Maintain Product Price Snapshots:** Retrieve the current price from ProductService and store it as an immutable `unit_price` on the line item.
    * **Calculate Line Totals:** Compute `unit_price * quantity` and store as a snapshot.
* **Inputs:** Order ID, Product ID, Quantity.
* **Outputs:** OrderItem aggregate state.
* **Events Produced:** `order_item.created`.

### 5.3 FulfillmentService
* **Purpose:** Manages the post-payment administrative process.
* **Responsibilities:**
    * **Fulfill Orders:** Allows Staff to confirm that items have been handed over or processed. Only OrderService may transition an Order into fulfilled.
    * **Track Fulfillment Completion:** Updates the final state of the Order aggregate.

* **Inputs:** Order ID, Actor ID.
* **Outputs:** Success/Failure confirmation, Updated Order state.
* **Events Produced:** `order.fulfilled`.

## 6. Ownership Boundaries
* **Cancellation Authority:** **Paid orders CANNOT be cancelled.** Once the Payment Domain provides authoritative settlement, the OrderService blocks all cancellation attempts. No refund workflow exists in this phase.
* **Pricing Immutability:** **Order item pricing is immutable after creation.** Once the snapshot is captured by OrderItemService, subsequent changes to the Product Catalog price have zero effect on the Order.
* **Independence Rule:** FulfillmentService operates independently of the Field Service domain. **No technician assignment, no booking generation, and no scheduling** are permitted within this workflow.


## 7. Event Responsibilities
Services emit events to signal state transitions. OrderService consumes the `payment.paid` event, updates the Order state, and orchestrates stock reduction by calling InventoryService.reduce_inventory(). PaymentService MUST NOT directly mutate Order state.

## 8. Audit Responsibilities
* **OrderService:** Log all state changes and the actors responsible for manual cancellations.
* **OrderItemService:** Log the original price snapshots and quantities for forensic reconciliation.
* **FulfillmentService:** Log the Staff member responsible for the final handover.

## 9. Dependencies
* **Product Domain:** Source of current pricing and stock availability (InventoryService).
* **Payment Domain:** Authoritative source for settlement signals (WebhookService).
* **Request Domain:** Parent aggregate for all order transactions.

## 10. Open Questions
* **UNRESOLVED — BUSINESS DECISION REQUIRED:** Should OrderService prevent creation if the Request is already in an `assigned` state, to strictly enforce the "product orders do not require assignment" rule?
resolution - yes OrderService should prevent creation if the Request is already in an `assigned` state

## 11. Completion Criteria
* Service designs strictly maintain the 1:1:1 Request-Order-Payment relationship.
* Pricing snapshots are codified as immutable events.
* Fulfillment is strictly gated by the `Paid` state.
