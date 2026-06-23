# Order Permissions Architecture

## 1. Purpose
The purpose of this document is to define the Role-Based Access Control (RBAC) boundaries for the Order Domain within the Entercom platform. It establishes the rules governing order creation, visibility, cancellation, and fulfillment, ensuring that financial commitments are secure and customer data is strictly isolated.

## 2. Scope
This document covers:
* Order creation and viewing permissions.
* Cancellation boundaries based on order state.
* Administrative fulfillment permissions.
* The transition ownership matrix for the Order lifecycle.

## 3. Out of Scope
* Payment processing and webhook permissions (Covered in Payment Permissions).
* Catalog and inventory permissions (Covered in Product Permissions).
* Technician assignment workflows (Not applicable to Phase 5 Product Orders).

## 4. Definitions
* **IDOR Protection:** Insecure Direct Object Reference prevention, ensuring a Customer can only interact with Orders linked to their own user ID.
* **Fulfillment:** The administrative process of marking a paid order as physically processed or handed over.

## 5. Permission Inventory
* `order.view_own`
* `order.view`
* `order.create`
* `order.cancel`
* `order.fulfill`
* `order.override_fulfillment`

## 6. Role Matrix

| Action | Customer | Staff | Manager | Superadmin |
| :--- | :---: | :---: | :---: | :---: |
| `order.view_own` | ALLOW | N/A | N/A | N/A |
| `order.view` | DENY | ALLOW | ALLOW | ALLOW |
| `order.create` | ALLOW | DENY | DENY | DENY |
| `order.cancel` | ALLOW* | ALLOW* | ALLOW* | ALLOW* |
| `order.fulfill` | DENY | ALLOW | ALLOW | ALLOW |
| `order.override_fulfillment` | DENY | DENY | ALLOW | ALLOW |

*\*Cancellation is strictly dependent on the Order State (See Section 8).*

## 7. Permission Specifications

### 7.1 `order.create`
* **Purpose:** Allows a user to initiate a new financial commitment based on a `product_order` request.
* **Scope:** Restricted to Customers.
* **Restrictions:** Fails if requested stock is unavailable or if the product is archived.
* **Ownership:** Customer owns the resulting Order.

### 7.2 `order.view_own` & `order.view`
* **Purpose:** Allows querying of order status and line item snapshots.
* **Scope:** Customers (`view_own`) are strictly limited via IDOR to orders they created. Staff/Manager/Superadmin (`view`) have global visibility.
* **Restrictions:** Customers cannot view other users' orders.
* **Ownership:** Customer (Own) / System (Global).

### 7.3 `order.cancel`
* **Purpose:** Allows termination of an order prior to financial settlement.
* **Scope:** Customers (Own orders), Staff/Manager/Superadmin (Global).
* **Restrictions:** See Section 8 (Cancellation Matrix).
* **Ownership:** Actor authorized based on role and order state.

### 7.4 `order.fulfill`
* **Purpose:** Allows administrative staff to mark a paid order as processed.
* **Scope:** Global across all `paid` orders.
* **Restrictions:** Strictly denied to Customers. Order MUST be in the `paid` state.
* **Ownership:** System/Administrative.

### 7.5 `order.override_fulfillment`
* **Purpose:** Allows elevated roles to resolve fulfillment blocks (e.g., resolving a post-payment stock depletion race).
* **Scope:** Global.
* **Restrictions:** Restricted to Manager and Superadmin.
* **Ownership:** System/Administrative.

## 8. Cancellation Matrix
Cancellation authority is strictly gated by the current state of the Order.

| Order Status | Customer | Staff | Manager | Superadmin |
| :--- | :---: | :---: | :---: | :---: |
| **`pending_payment`**| ALLOW (Own) | ALLOW | ALLOW | ALLOW |
| **`paid`** | DENY | DENY | DENY | DENY |
| **`fulfilled`** | DENY | DENY | DENY | DENY |

**Crucial Rule:** `paid` orders are NOT cancellable. No administrative role possesses the authority to cancel a settled order in the Phase 5 MVP. No refund system exists.

## 9. Transition Ownership Matrix

| Transition | Start State | End State | Owner | Trigger | Authority |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Create** | `None` | `Created` | Customer | `order.create` | System (Stock Validation) |
| **Await Payment**| `Created`| `Pending Payment`| System | Payment Initialization | System |
| **Settle** | `Pending Payment`| `Paid` | System | Webhook `payment.paid` | Payment Domain |
| **Cancel (Manual)**| `Pending Payment`| `Cancelled` | Actor | `order.cancel` | RBAC |
| **Cancel (Expiry)**| `Pending Payment`| `Cancelled` | System | 24h Expiration Job | Background Job |
| **Fulfill** | `Paid` | `Fulfilled` | Staff+ | `order.fulfill` | RBAC |

## 10. Restrictions & Security Requirements
* **IDOR Prevention:** All Customer-facing endpoints MUST enforce strict filtering ensuring `request.user.id == order.customer_id`.
* **State Immutability:** Once an order transitions to `Paid` or `Cancelled`, its fundamental financial data (snapshots, totals) MUST NOT be mutated by any actor.

## 11. Dependencies
* **Order Domain Architecture:** Defines the states and lifecycles governed by these permissions.
* **Payment Domain:** Provides the authoritative `payment.paid` trigger required to unlock the `order.fulfill` permission.

## 12. Open Questions
* None at this time.

## 13. Completion Criteria
* IDOR boundaries are clearly established for Customer visibility.
* The absolute restriction on cancelling `paid` orders is codified for all roles.
* Administrative fulfillment is strictly separated from Customer capabilities.
