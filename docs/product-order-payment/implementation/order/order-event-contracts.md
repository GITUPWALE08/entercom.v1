# Order Event Contracts

## 1. Purpose
The purpose of this document is to define the strict payload schemas, producer/consumer ownership, and transaction requirements for all events emitted by the Order Domain. It establishes the architectural contract for signaling state transitions throughout the order lifecycle.

## 2. Scope
This document covers:
* Order lifecycle events.
* The standard event envelope.
* Idempotency and transaction requirements.

## 3. Out of Scope
* Technical implementation of the event broker.
* Celery task definitions.
* Python code generation.
* WebSockets and Notification delivery (Phase 6).

## 4. Dependencies
* **Order Domain Architecture**
* **Order Events Architecture**
* **Order Model Design**
* **Order Auditing Architecture**

## 5. Event Versioning Policy
* **Current Version:** `v1`
* **Versioning Rules:** Incremented if backward-incompatible changes are introduced.
* **Backward Compatibility Rules:** Adding optional fields maintains the current version. Removing fields or changing types requires a new version.
* **Deprecation Rules:** Old versions supported for 90 days post-deprecation.

## 6. Standard Event Envelope
All events MUST define the following base fields.

| Field Name | Type | Required | Description | Example Value |
| :--- | :--- | :--- | :--- | :--- |
| `event_id` | UUID | Yes | Unique identifier for the event instance. | `a1b2c3d4-...` |
| `event_name` | String | Yes | The canonical name of the event. | `order.created` |
| `event_version`| String | Yes | The schema version. | `v1` |
| `occurred_at` | Datetime| Yes | ISO-8601 UTC timestamp of the mutation. | `2026-06-18T10:00:00Z`|
| `correlation_id`| UUID | Yes | Traceability identifier linking cross-domain flows.| `x9y8z7...` |
| `actor_id` | String | Yes | ID of the user or `SYSTEM` responsible for the change.| `user_123` |
| `producer` | String | Yes | The originating service. | `OrderService` |
| `data` | Object | Yes | The event-specific payload. | `{...}` |

## 7. Event Inventory & Payload Contracts

### 7.1 `order.created`
* **Purpose:** Notify that a customer has initiated a financial commitment.
* **Producer:** `OrderService` (Trigger: Successful order creation).
* **Consumers:** PaymentService (Current), Audit System (Current).
* **Transaction Requirements:** Emit After Commit.
* **Idempotency Key:** `data.order_id`
* **Data Payload:**
    * `order_id` (UUID, Required)
    * `request_id` (UUID, Required)
    * `customer_id` (UUID, Required)
    * `total_amount` (Decimal, Required)

### 7.2 `order.cancelled`
* **Purpose:** Notify that a non-terminal order was terminated. **Paid orders cannot emit `order.cancelled`.**
* **Producer:** `OrderService.cancel_order()` (Sole Producer).
* **Consumers:** PaymentService (Current), Audit System (Current).
* **Transaction Requirements:** Emit After Commit.
* **Idempotency Key:** `data.order_id`
* **Data Payload:**
    * `order_id` (UUID, Required)
    * `request_id` (UUID, Required)
    * `customer_id` (UUID, Required)
    * `reason_code` (String, Optional)

### 7.3 `order.fulfilled`
* **Purpose:** Notify that physical handover/processing is complete.
* **Producer:** `FulfillmentService` (Trigger: Administrative confirmation).
* **Consumers:** Audit System (Current), Notification Service (Future).
* **Transaction Requirements:** Emit After Commit.
* **Idempotency Key:** `data.order_id`
* **Data Payload:**
    * `order_id` (UUID, Required)
    * `request_id` (UUID, Required)
    * `customer_id` (UUID, Required)
    * `staff_id` (UUID, Required)

## 8. Audit Requirements
* **Audit Required:** Yes, for all listed events.
* **Required Audit Action:** The `event_name` maps 1:1 to the `action` field in the Audit log.
* **Metadata Requirements:** All payloads must be fully logged.

## 9. Contract Validation Rules
* **Required Fields:** Strict enforcement.
* **Nullable Fields:** Only `reason_code` in cancellation is conditionally nullable.
* **Type Validation:** UUIDs and ISO-8601 Datetimes.
* **Ownership Validation:** Producer services must validate actor authorization before emission.

## 10. Future Integration Notes
* **Notification consumers:** Future phase will notify customers on `order.fulfilled` and `order.cancelled`.
* **WebSocket consumers:** Not defined for Product Orders in Phase 5.
* **Analytics consumers:** Future sales metrics.

## 11. Forbidden Event Behavior
* **Explicitly Prohibit:** `OrderService` emitting `payment.paid` or `payment.failed`.
* **Explicitly Prohibit:** Event emission inside an uncommitted transaction.
* **Explicitly Prohibit:** Emitting `order.cancelled` for an order in the `paid` state.

## 12. Open Questions
No unresolved event-contract questions remain.

## 13. Completion Criteria
* `OrderService` and `FulfillmentService` are the sole producers of order lifecycle events.
* Transaction requirements guarantee emission only after database commit.
* Correlation IDs securely tie Order events back to the parent Request.
