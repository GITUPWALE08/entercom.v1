# Order Permission Mapping Design

## 1. Purpose
The purpose of this document is to translate the architectural permissions defined in the Order Domain into strict, executable implementation rules. It maps domain-level RBAC to specific Service actions, establishing exact authorization boundaries for financial commitments, cancellations, and fulfillment.

## 2. Scope
This document covers:
* `OrderService` permission mappings.
* `FulfillmentService` permission mappings.
* Role-specific execution limits for Customers, Staff, Managers, and Superadmins.

## 3. Out of Scope
* Product catalog or inventory permissions.
* Payment processing or webhook permissions.
* Python/Django code generation.

## 4. Dependencies
* **Order Permissions Architecture**
* **Order Service Implementation Design**

## 5. Role Matrix
* **Customer:** Create orders, view own orders, cancel own pending orders.
* **Staff:** View all orders, fulfill paid orders.
* **Manager:** Cancel any pending order, override fulfillment blocks.
* **Superadmin:** Full platform access.

## 6. Permission Inventory
* `order.create`: Purpose: Initiate order. Owning Service: OrderService. Domain: Order.
* `order.view_own`: Purpose: View personal orders. Owning Service: OrderService. Domain: Order.
* `order.view`: Purpose: View all orders. Owning Service: OrderService. Domain: Order.
* `order.cancel`: Purpose: Terminate order. Owning Service: OrderService. Domain: Order.
* `order.fulfill`: Purpose: Mark processed. Owning Service: FulfillmentService. Domain: Order.
* `order.override_fulfillment`: Purpose: Force fulfillment. Owning Service: FulfillmentService. Domain: Order.

## 7. Permission Mapping Matrix

| Permission | Service Action | Allowed Roles | Restrictions |
| :--- | :--- | :--- | :--- |
| `order.create` | `OrderService.create_order()` | Customer | Fails if stock unavailable or product archived. |
| `order.view_own` | `OrderService.get_order()` | Customer | Customer must own the Order. |
| `order.view` | `OrderService.list_orders()` | Staff, Manager, Superadmin | Global visibility. |
| `order.cancel` | `OrderService.cancel_order()` | Customer, Manager, Superadmin | Customer can only cancel own. ONLY `pending_payment` orders. |
| `order.fulfill` | `FulfillmentService.fulfill()`| Staff, Manager, Superadmin | ONLY `paid` orders. |
| `order.override_fulfillment`| `FulfillmentService.override()`| Manager, Superadmin | ONLY `paid` orders with fulfillment blocks. |

## 8. Ownership Rules
* **Who grants access:** Superadmins via Role assignments.
* **Who enforces access:** API Permission Classes (HTTP layer) and Service-level decorators/checks (Business layer).
* **Who audits access:** The Audit subsystem captures state mutations.

## 9. IDOR Protection Requirements
* **Ownership Validation Required:** Yes (For `order.view_own` and Customer `order.cancel`).
* **Validation Location:** `BookingViewSet.get_queryset()` (API layer) and `OrderService` (Service layer validation).
* **Failure Result:** `404 Not Found` (to mask existence) or `403 Forbidden`. Customer may only view own order. Customer may only cancel own order.

## 10. Service Enforcement Matrix

| Service | Action | Required Permission |
| :--- | :--- | :--- |
| `OrderService` | `create_order` | `order.create` |
| `OrderService` | `get_order` | `order.view_own` or `order.view` |
| `OrderService` | `cancel_order` | `order.cancel` |
| `FulfillmentService`| `fulfill` | `order.fulfill` |
| `FulfillmentService`| `override` | `order.override_fulfillment` |

## 11. Restriction Matrix
* **Pending Payment Restrictions:** Cancellable by Customer (own) or Manager/Superadmin.
* **Paid Order Restrictions:** NOT cancellable by any role.
* **Fulfillment Restrictions:** Restricted to Staff+. Order must be `paid`.
* **Manager Overrides:** `order.override_fulfillment` and administrative `order.cancel` are restricted to Manager+ to resolve edge cases (e.g., stock races).

## 12. Permission Audit Requirements
* `order.create`: Audit Required (Yes), Action (`order.created`), Metadata (Actor ID).
* `order.cancel`: Audit Required (Yes), Action (`order.cancelled`), Metadata (Reason, Actor ID, State Delta).
* `order.fulfill`: Audit Required (Yes), Action (`order.fulfilled`), Metadata (Actor ID).
* `order.override_fulfillment`: Audit Required (Yes), Action (`order.fulfilled`), Metadata (Override Reason, Actor ID).

## 13. Cross-Domain Permission Rules
* **Request domain permissions never authorize:** Inventory mutation, payment mutation, or order fulfillment.
* **Payment domain permissions never authorize:** Order fulfillment or creation.
* **Product domain permissions never authorize:** Order state transitions.

## 14. Open Questions
No unresolved permission-mapping questions remain.

## 15. Completion Criteria
* IDOR boundaries are clearly established for Customer visibility and cancellation.
* The absolute restriction preventing cancellation of `paid` orders is codified.
* Administrative fulfillment boundaries are strictly separated from Customer roles.
