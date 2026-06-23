# Order Domain Event Architecture

## 1. Purpose
The purpose of this document is to define the Domain Events emitted by the Order aggregate. It establishes the architectural contract for signaling state transitions throughout the order lifecycle, ensuring data consistency and forensic visibility for financial commitments.

## 2. Scope
This document covers:
* Event taxonomy for Order state transitions.
* Required payload fields for order-related messages.
* Producer-Consumer mapping for fulfillment and cancellation flows.

## 3. Out of Scope
* Technical implementation of the event bus or message broker.
* Notification or WebSocket delivery logic (Phase 6).
* Payment or Product domain events (Covered in separate documents).

## 4. Definitions
* **Order Aggregate:** The central entity governing the financial state and line items of a transaction.
* **Producer:** The service (OrderService or FulfillmentService) responsible for the state mutation and event emission.
* **Correlation ID:** A persistent identifier linking the Order event chain back to the original Request.

## 5. Event Taxonomy

| Event Name | Purpose | Trigger | Producer |
| :--- | :--- | :--- | :--- |
| `order.created` | Notify that a customer has initiated a financial commitment. | Successful stock validation & record persistence. | `OrderService` |
| `order.cancelled`| Notify that a non-terminal order was terminated. | Manual actor action or 24-hour expiration. | `OrderService.cancel_order()` (Sole Producer) |
| `order.fulfilled`| Notify that physical handover/processing is complete. | Administrative confirmation by Staff. | `FulfillmentService` |

## 6. Detailed Event Specifications

### 6.1 `order.created`
* **Purpose:** Serves as the trigger for the Payment Domain to initialize the transaction.
* **Payload Requirements:** `order_id`, `request_id`, `customer_id`, `total_amount`, `correlation_id`, `timestamp`.

### 6.2 `order.cancelled`
* **Constraint:** This event ONLY applies to orders in the `pending_payment` state.
* **Rule:** **Paid orders cannot emit `order.cancelled`.**
* **Payload Requirements:** `order_id`, `request_id`, `customer_id`, `reason_code`, `correlation_id`, `timestamp`.

### 6.3 `order.fulfilled`
* **Purpose:** Marks the completion of the Order lifecycle.
* **Trigger:** Staff confirms administrative fulfillment.
* **Payload Requirements:** `order_id`, `request_id`, `staff_id`, `correlation_id`, `timestamp`.

## 7. Consumers
* **Audit Domain:** Mandatory consumer for forensic integrity.
* **Payment Domain:** Listens for `order.cancelled` to terminate pending transactions.
* **Inventory Domain:** (In Phase 5, depletion is triggered by Payment, but Inventory listens to `order.created` to understand potential demand).

## 8. Payload Requirements
Every order event MUST include the following fields to ensure traceability:
* `order_id` (UUID)
* `request_id` (UUID)
* `customer_id` (UUID)
* `correlation_id` (UUID)
* `timestamp` (ISO-8601 UTC)
* `event_version` ("v1")

## 9. Audit Requirements
All order events must be written to the append-only audit log. Every transition MUST be traceable to an `actor_id` (Customer, Staff, or System for expiration).

## 10. Dependencies
* **Order Services:** Primary producers.
* **Product Domain:** Source of line item pricing snapshots.
* **Request Domain:** Parent aggregate trigger.

## 11. Open Questions
* **UNRESOLVED — BUSINESS DECISION REQUIRED:** Should `order.fulfilled` contain a snapshot of the final itemized list for consumer convenience, or should consumers query the Order aggregate directly?

## 12. Completion Criteria
* Event taxonomy covers the entire Order lifecycle.
* The restriction on `order.cancelled` for Paid orders is enforced.
* Traceability between Request and Order is guaranteed via mandatory payload fields.
