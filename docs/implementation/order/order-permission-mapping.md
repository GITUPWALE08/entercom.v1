# Order Permission Mapping Design

## Purpose
To map permissions to service actions, allowed roles, restrictions, and ownership rules within the Order Domain for Phase 5.

## Scope
* OrderService

## Out of Scope
* Django permissions generation
* Permission classes or decorators
* DRF views or API definitions
* Code implementations

## Role Definitions
* **Customer:** End-user with access to public catalog resources.
* **Staff:** Internal users with standard operational access.
* **Manager:** Internal users with elevated administrative access.
* **Superadmin:** System administrators with full access.
* **SYSTEM:** Non-human actor for automated backend processes.

## Permission Inventory
* `order.create`
* `order.view_own`
* `order.view`
* `order.cancel`
* `order.fulfill`
* `order.override_fulfillment`

## Permission Mapping Matrix

| Permission | Service | Action | Roles | Restrictions |
| ---------- | ------- | ------ | ----- | ------------ |
| `order.create` | OrderService | create_order | Customer | Customer creates own order |
| `order.view_own` | OrderService | get_order | Customer | Customer views own order |
| `order.view` | OrderService | list_orders / get_order | Staff, Manager, Superadmin | None |
| `order.cancel` | OrderService | cancel_order | Customer, Manager, Superadmin | Paid orders cannot be cancelled |
| `order.fulfill` | OrderService | fulfill_order | Staff, Manager, Superadmin | None |
| `order.override_fulfillment` | OrderService | override_fulfillment | Manager, Superadmin | None |

## Restrictions
* Paid orders cannot be cancelled.
* Customers cannot view another customer's order.
* Customers cannot fulfill orders.
* Customers cannot override fulfillment.
* Staff cannot override fulfillment.

## Ownership Validation Rules
* **Customer Ownership:** Orders belong strictly to the Customer who initiated the Request.

## IDOR Protection Rules
For every customer-owned resource, strict IDOR validation is applied:
* `order.view_own`: Customer may only access: `order.customer_id == actor.id`
* `order.cancel` (as Customer): Customer may only access: `order.customer_id == actor.id`

## Forbidden Actions
* **Customers MUST NOT:**
  * fulfill orders
  * view another customer's order
  * override fulfillment
* **Staff MUST NOT:**
  * override fulfillment

## Dependencies
* docs/architecture/order/order-permissions.md
* docs/architecture/order/order-services.md
* docs/implementation/order/order-service-design.md

## Completion Criteria
UNRESOLVED — BUSINESS DECISION REQUIRED
