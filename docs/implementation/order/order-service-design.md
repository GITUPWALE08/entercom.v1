# Order Service Implementation Design

## Purpose
To define the concrete implementation responsibilities, transaction boundaries, and event orchestration for the Order Domain services.

## Scope
* OrderService

## Out of Scope
* Django ORM code generation
* Serializers
* APIs
* Method implementations
* Payment processing or webhook handling
* Inventory math or stock adjustments

## Definitions
UNRESOLVED — BUSINESS DECISION REQUIRED

## Service Inventory
1. OrderService

## Detailed Service Sections

### 1. OrderService
#### Purpose
To act as the consolidated orchestrator for the entire Order lifecycle.
#### Ownership
Owns Order creation, Order cancellation, Order fulfillment, and Payment-required transitions. Data ownership of `Order` entities, `OrderItem` entities, pricing snapshots, and fulfillment state.
#### Responsibilities
Atomically creates the Order and all OrderItems. Takes immutable price snapshots. Calculates totals. Handles cancellation logic. Consumes `payment.paid` to process payment-required transitions. Orchestrates inventory reduction by calling `InventoryService.reduce_inventory()`. Manages administrative fulfillment.
#### Inputs
`request_id`, requested product IDs/quantities, actor metadata, and `payment.paid` events.
#### Outputs
Instantiated `Order` and `OrderItem` records. Updated Order state.
#### Validations Owned
Ensures the 1:1 Request-to-Order mapping. Validates that `total_amount` exactly equals the sum of all `OrderItem.line_total_snapshot` values. Verifies orders are `pending_payment` before cancellation. Paid orders cannot be cancelled.
#### Permissions Enforced
Enforces `order.create` (Customers). Enforces `order.cancel` (Customer-own, Manager, Superadmin). Enforces `order.fulfill` (Staff+).
#### Audit Actions Produced
Logs `order.created`, `order.cancelled`, and `order.fulfilled`.
#### Events Produced
Emits `order.created`, `order.cancelled`, and `order.fulfilled`.
#### Transaction Boundaries
**Order Creation Transaction:** Requires an atomic block locking the Request.
**Order Fulfillment Transaction:** Requires an atomic block ensuring the order transitions to `fulfilled` and the `order.fulfilled` event is safely queued.
#### Cross-Service Dependencies
Calls `ProductService` to retrieve the current price during line item creation. Calls `InventoryService.reduce_inventory()`.
#### Forbidden Responsibilities
MUST NOT update Payment states directly. MUST NOT communicate with Payment Providers.
#### Failure Handling
Paid orders cannot be cancelled; attempting to do so raises a strict exception. Concurrent creation requests for the same `request_id` fail on database unique constraints.
#### Idempotency Requirements
Fulfillment on an already `fulfilled` order must cleanly exit.
#### Completion Criteria
Pricing snapshot immutability is strictly encapsulated. 1:1 Request-Order mapping is guaranteed.

## Transaction Matrix
* **Order Fulfillment Transaction:** Defined in OrderService.
* **Order Creation:** Defined in OrderService.

## Ownership Matrix
* **OrderService:** Order creation, Order cancellation, Order fulfillment, Payment-required transitions.

## Forbidden Interactions
* OrderService MUST NOT emit payment events.

## Dependencies
* docs/architecture/order/order-domain.md
* docs/architecture/order/order-services.md
* docs/architecture/order/order-events.md
* docs/architecture/order/order-permissions.md
* docs/architecture/order/order-auditing.md
* docs/workflows/product-order-flow.md
* docs/implementation/order/order-model-design.md

## Open Questions
UNRESOLVED — BUSINESS DECISION REQUIRED

## Completion Criteria
UNRESOLVED — BUSINESS DECISION REQUIRED
