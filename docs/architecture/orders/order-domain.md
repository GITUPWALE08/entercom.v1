# Order Domain Architecture

## 1. Purpose
The purpose of this document is to define the architectural boundaries, rules, and lifecycle of the Order domain within the Entercom platform. It establishes the relationship between customer requests and financial commitments, ensuring data integrity through immutable pricing snapshots and strictly bounded state transitions.

## 2. Scope
This document covers:
* Order creation and validation rules.
* OrderItem aggregation and pricing snapshots.
* Relationship between `Request`, `Order`, and `Payment`.
* Order lifecycle and 24-hour expiration logic.
* Interaction with the Product (Inventory) and Payment domains.
* Fulfillment authority.

## 3. Out of Scope
* Shipping, tracking, and delivery logistics.
* Multi-payment, split-payment, or installment scenarios.
* Refunds, returns, and partial cancellations.
* Taxes and complex discount/coupon logic.
* Technician assignment, scheduling, or booking creation.

## 4. Definitions
* **Order Aggregate:** The financial representation of a Request, containing the total amount and state.
* **OrderItem:** A child entity of an Order representing a specific Product and quantity.
* **Pricing Snapshot:** The requirement that `OrderItem` stores the `unit_price` and `line_total` at the moment of creation. Order totals are derived from these snapshots.
* **Expiration (24h):** The terminal transition triggered when a payment remains non-terminal for more than 24 hours.

## 5. Domain Boundaries & Relationships
* **Request Lifecycle Ownership:** The Request Domain NEVER owns inventory, payment, or fulfillment. The Order Domain owns inventory interaction, payment interaction, and fulfillment.
* **1 Request ↔ 1 Order:** One `product_order` Request creates exactly one Order. An Order belongs to exactly one Request. No multi-order requests or shared orders.
* **1 Order ↔ 1 Payment:** One Order has exactly one Payment. One Payment belongs to exactly one Order. No split payments, installments, or multiple transactions.
* **Independent Fulfillment:** Product orders are fulfilled independently and do NOT require technician assignment, scheduling, or booking creation.

## 6. Lifecycle & State Ownership
An Order progresses through the following states:
1. **Created:** The Order is initialized. Stock availability is verified; if insufficient, creation is rejected.
2. **Pending Payment:** The Order is awaiting authoritative confirmation from the Payment Domain.
3. **Paid:** Authoritative payment webhook received. Inventory is reduced within this success transaction.
4. **Fulfilled:** Terminal state. The products have been processed/handed over.
5. **Cancelled:** Terminal failure state. Triggered by payment expiration (24h) or manual cancellation.

## 7. Inventory & Payment Interaction
* **Pre-creation Validation:** Order creation MUST fail if `quantity_available` is insufficient. No waitlists or backorders are supported.
* **Stock Depletion Rule:** Inventory is NOT reserved at creation. Inventory reduction is orchestrated by OrderService calling InventoryService.reduce_inventory() after consuming the payment.paid event.
* **Payment Failure:** If a payment attempt fails, the Order remains `Pending Payment`. The customer is permitted to retry within the 24-hour window.

## 8. Cancellation Rules
* **Status `pending_payment`:** Cancellable by Customer, Staff, or Manager.
* **Status `paid`:** Not cancellable in the Phase 5 MVP. No refund system or workflow exists.
* **Expiration:** If an Order remains in the `Pending Payment` state for > 24 hours, the system transitions the Payment, Order, and parent Request to `cancelled`.

## 9. Event Boundaries
The Order Domain emits the following events:
* `order.created`
* `order.paid`
* `order.cancelled`
* `order.fulfilled`

## 10. Audit Requirements
The system MUST capture:
* All state transitions and the actor/trigger responsible.
* Immutable pricing snapshots for every `OrderItem`.
* Correlation IDs linking the Order to the parent Request and subordinate Payment.

## 11. Dependencies
* **Product Domain:** Source for current price and stock validation. Target of inventory reduction.
* **Payment Domain:** Authoritative trigger for `Paid` state transitions.
* **Request Domain:** Parent aggregate and trigger for Order initialization.

## 12. Completion Criteria
* Lifecycle rules ensure stock is only reduced upon confirmed payment.
* Pricing snapshots guarantee financial auditability and protect against catalog price changes.
* 1:1:1 mapping between Request, Order, and Payment is strictly enforced.
* No dependencies on assignment, scheduling, or bookings exist for product orders.
