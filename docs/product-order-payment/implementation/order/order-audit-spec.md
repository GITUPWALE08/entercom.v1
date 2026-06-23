# Order Audit Specification

## 1. Purpose
The purpose of this document is to define the strict implementation requirements for the Order Domain audit trail. It details the payload and metadata requirements for capturing the lifecycle of an order, enforcing explicit audits for administrative operations, cancellations, and fulfillment tracking.

## 2. Scope
This document covers:
* The standard audit record structure for Orders.
* Detailed metadata requirements for Order creation, cancellation, and fulfillment.
* Administrative operation auditing.
* Correlation ID and immutable storage expectations.

## 3. Out of Scope
* Financial auditing (Covered in Payment Auditing).
* Inventory reduction auditing (Covered in Product Auditing).
* Technical implementation of the audit log table.

## 4. Dependencies
* **Order Auditing Architecture**
* **Order Service Implementation Design**
* **Order Event Contracts**

## 5. Audit Principles
* **Immutability:** Audit records MUST NEVER be modified or deleted.
* **Traceability:** Every state transition must capture the before and after states.
* **Actor Attribution:** Administrative overrides must explicitly name the Manager/Superadmin.
* **Correlation Tracking:** Order events must propagate the `correlation_id` originating from the Request.

## 6. Standard Audit Record Structure
Every audit record emitted by the Order Domain MUST define the following base fields:

| Field Name | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `action` | String | Yes | Canonical action name (e.g., `order.cancelled`). |
| `actor_id` | String | Yes | ID of the user or `SYSTEM`. |
| `actor_type` | String | Yes | e.g., `Customer`, `Staff`, `Manager`, `System`. |
| `resource_type` | String | Yes | `Order`. |
| `resource_id` | String | Yes | Primary key of the mutated entity. |
| `correlation_id`| String | Yes | Identifier linking cross-domain flows. |
| `occurred_at` | Datetime| Yes | ISO-8601 UTC timestamp. |
| `metadata` | JSON | Yes | Action-specific payloads and state deltas. |

## 7. Action Inventory & Metadata Requirements

### 7.1 `order.created`
* **Purpose:** Audit the creation of an order and its line items.
* **Producer:** `OrderService`
* **Actor Requirements:** Customer.
* **Required Metadata:**
    * `request_id` (String)
    * `total_amount` (Decimal/String)
    * `item_count` (Integer)

### 7.2 `order.cancelled`
* **Purpose:** Audit the termination of a `pending_payment` order.
* **Producer:** `OrderService`
* **Actor Requirements:** Customer, Staff, Manager, Superadmin, or `SYSTEM` (for expiration).
* **Required Metadata:**
    * `before_state` (String: `pending_payment`)
    * `after_state` (String: `cancelled`)
    * `reason` (String, Required if manual admin cancellation)

### 7.3 `order.fulfilled`
* **Purpose:** Audit the physical processing/handover of the order.
* **Producer:** `FulfillmentService`
* **Actor Requirements:** Staff, Manager, Superadmin.
* **Required Metadata:**
    * `before_state` (String: `paid`)
    * `after_state` (String: `fulfilled`)

### 7.4 `order.payment_required`
*(Note: As per architecture, Order enters `pending_payment` immediately upon creation. If a distinct audit is required for this transition beyond `order.created`, the payload is as follows)*
* **Purpose:** Audit the explicit gating of fulfillment pending payment.
* **Producer:** `OrderService`
* **Actor Requirements:** `SYSTEM`
* **Required Metadata:** `total_amount`

## 8. Administrative Operations
* **Manager Cancellation:** When `actor_type` is `Manager` or `Superadmin` for `order.cancelled`, the `reason` field in metadata is **MANDATORY**.
* **Fulfillment Override:** When a Manager forces `order.fulfilled` (e.g., resolving a stock race), the `metadata` MUST include an `override_reason` field.

## 9. Correlation ID Rules
* **Propagation Rules:** The `order.created` audit MUST share the exact `correlation_id` present on the parent Request.
* **Reuse Rules:** The `order.cancelled` audit triggered by a payment expiration MUST share the `correlation_id` of the `payment.expired` action.

## 10. Immutable Audit Expectations
* **Fields never editable:** All fields.
* **Fields never deletable:** All fields.
* **Historical retention expectations:** Permanent retention is mandated for all Order audits to guarantee financial and operational traceability.

## 11. Audit Producer Matrix
| Service | Audit Actions |
| :--- | :--- |
| `OrderService` | `order.created`, `order.cancelled`, `order.payment_required` |
| `FulfillmentService`| `order.fulfilled` |

## 12. Forbidden Audit Behavior
* Explicitly prohibit: Deleting audit records.
* Explicitly prohibit: Cancelling a `paid` order (attempting to do so must be caught by permissions/services before an audit is even attempted, though security logs may capture the unauthorized attempt).

## 13. Open Questions
No unresolved audit specification questions remain.

## 14. Completion Criteria
* `order.cancelled` explicitly mandates a reason when performed by an administrator.
* Correlation IDs properly link the Order back to the parent Request.
* The producer matrix correctly maps services to actions.
