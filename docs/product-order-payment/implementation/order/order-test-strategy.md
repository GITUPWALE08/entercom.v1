# Order Test Strategy

## 1. Purpose
The purpose of this document is to define the comprehensive testing strategy for the Order Domain. It ensures that all architectural invariants, financial snapshots, 1:1 mapping rules, and lifecycle boundaries are rigorously verified before deployment.

## 2. Scope
This document covers:
* Model Tests (Order, OrderItem).
* Service Tests (OrderService, OrderItemService, FulfillmentService).
* API Tests (Endpoints, Filters, Pagination, IDOR).
* Permission Tests (RBAC, Customer isolation).
* Event Tests (Payload contracts).
* Audit Tests (Metadata, Immutability).
* Integration Tests (Request -> Order flow).

## 3. Out of Scope
* Actual Python/pytest code generation.
* Notification testing (Phase 6).
* WebSocket real-time delivery testing (Phase 6).
* Direct inventory reduction testing (Covered in Product Domain).

## 4. Dependencies
* **Order Model Design**
* **Order Service Implementation Design**
* **Order Permission Mapping**
* **Order API Design**
* **Order Event Contracts**
* **Order Audit Specification**
* **Order Background Jobs Design**

## 5. Coverage Goals

### 5.1 Required Coverage Matrix
| Area | Target Coverage | Required Assertions | Failure Conditions |
| :--- | :--- | :--- | :--- |
| **Models** | 100% Constraints | 1 Request → 1 Order mapping. | Duplicate order created for request. |
| **Services** | 100% Public Methods | State mutation, Audit invocation, Event emission. | Unauthorized status transitions. |
| **Permissions** | 100% Roles | `PermissionDenied` raised for unauthorized actors. | IDOR breach. |
| **APIs** | 100% Endpoints | Status codes, Schema matches. | Missing endpoints or 500 errors. |
| **Events** | 100% Contracts | Payload validation against `order-event-contracts.md`. | Schema violations. |
| **Audits** | 100% Actions | Immutability, `correlation_id` tracking. | Missing reason codes for manual actions. |
| **Integration**| 100% Core Flows | Order Creation -> Payment Initialization flow. | Domain boundaries crossed inappropriately. |

## 6. Test Categories

### 6.1 Model Tests
* **One Request → One Order:** Verify database constraint prevents creating multiple orders for a single request.
* **Snapshot Preservation:** Verify `OrderItem` stores unit price and line total as immutable values that do not change if the original `Product` price changes.
* **Order State Constraints:** Verify status field is strictly limited to allowed values.

### 6.2 Service Tests
#### `OrderService`
* **Create Order:** Verify creation of Order and OrderItems, price calculation, status set to `pending_payment`, `order.created` event emission, and audit creation. Verify failure if `InventoryService.validate_stock()` fails.
* **Cancel Order:** Verify cancellation of `pending_payment` orders. Verify strict rejection of cancellation attempts for `paid` orders. Verify `order.cancelled` event and audit creation.
* **Payment Paid Consumption:** Verify that when `OrderService` consumes a `payment.paid` event, it updates status to `Paid` and subsequently calls `InventoryService.reduce_inventory()`.

#### `FulfillmentService`
* **Fulfill Order:** Verify transition from `paid` to `fulfilled`. Verify event emission (`order.fulfilled`) and audit creation.

### 6.3 Permission Tests
* **Customer Denials:** Prove Customer cannot fulfill orders, cancel `paid` orders, or cancel other customers' orders.
* **Staff Access:** Prove Staff can fulfill orders but cannot access manager-only actions (like overriding fulfillment blocks).
* **Manager Access:** Prove Manager can cancel pending orders and perform overrides.
* **Superadmin Access:** Prove Superadmin has full access.

### 6.4 API Tests
* **Endpoints:** `POST /orders/`, `GET /orders/`, `GET /orders/{id}/`, `POST /orders/{id}/cancel/`, `POST /orders/{id}/fulfill/`.
* **Scenarios:**
    * Success cases for all valid operations.
    * Validation failures (e.g., trying to purchase archived products).
    * Authorization failures.
* **IDOR Prevention:** Verify Customer A receives 404/403 when requesting Customer B's order.
* **Filtering & Pagination:** Verify filtering by `status` and `request_id`.

### 6.5 Event Tests
* **Payload Validation:** Validate schema, version, required fields, and producer for:
    * `order.created`
    * `order.cancelled`
    * `order.fulfilled`
* **Contract Verification:** Prove `order.cancelled` is NEVER emitted for an order in the `paid` state.

### 6.6 Audit Tests
* **Action Names:** Verify exactly matching action names from `order-audit-spec.md`.
* **Metadata & Actor:** Verify actor ID/Role, required metadata fields (e.g., `reason` for manager cancellations).
* **Correlation:** Prove `order.created` correctly propagates the `correlation_id` from the parent request.

### 6.7 Background Job Tests
* **Inventory Low Stock Job:**
    * Verify threshold detection logic.
    * Verify duplicate prevention (Idempotency).
    * Verify `inventory.low_stock` audit and event generation.
    * Verify transaction rollback on failure.

### 6.8 Integration Tests
* **Order Creation flow:** Verify `Request` parameters translate correctly into a created `Order`.
* **Stock Reduction flow:** Explicitly verify that `InventoryService.reduce_inventory()` is NOT called during order creation, but ONLY after `OrderService` handles the `payment.paid` integration signal.

### 6.9 Concurrency Tests
* **Order Creation Race Conditions:** Prove that two concurrent attempts to create an order for the same `request_id` result in one success and one database constraint failure.

## 7. Open Questions
No unresolved testing strategy questions remain.

## 8. Completion Criteria
* The document outlines enough detail for QA to implement full coverage tests.
* Strict validation of the 1:1 Request->Order mapping is codified.
* The rule that `paid` orders cannot be cancelled is explicitly covered across Service, API, and Event tests.
