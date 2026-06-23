# Order Model Design

## 1. Purpose
The purpose of this document is to define the physical data models for the Order domain. It enforces the strict 1:1 mapping with Requests, the immutability of pricing snapshots within line items, and the authorized lifecycle states for financial commitments.

## 2. Scope
This document covers:
* `Order` aggregate entity.
* `OrderItem` child entity.
* Data constraints, indexes, and snapshot definitions.

## 3. Out of Scope
* Payment state tracking (Covered in Payment Domain).
* Inventory reduction implementation (Delegated to InventoryService).
* Django ORM definitions or code.
* Fulfillment logic involving technicians or bookings.

## 4. Dependencies
* **Product Domain:** Source for initial metadata and price during order creation.
* **Request Domain:** Parent aggregate that dictates the 1:1 `request_id` mapping.

## 5. Entity Inventory

### 5.1 Order
* **Purpose:** The root financial aggregate representing a customer's confirmed intent to purchase.
* **Ownership:** OrderService.
* **Lifecycle Participation:** Progresses through `created`, `pending_payment`, `paid`, `fulfilled`, and `cancelled`.

### 5.2 OrderItem
* **Purpose:** Represents a specific product and quantity within an Order, carrying immutable historical data.
* **Ownership:** OrderItemService.
* **Lifecycle Participation:** Immutable once created. Its lifecycle is bound entirely to the parent Order.

## 6. Field Definitions

### 6.1 Order
* `id`: UUID (Required, Non-nullable, Read-only, Source of Truth: DB, Validation: DB)
* `request_id`: UUID/FK (Required, Non-nullable, Read-only, Source of Truth: DB, Validation: DB)
* `customer_id`: UUID/FK (Required, Non-nullable, Read-only, Source of Truth: DB, Validation: DB)
* `status`: String [created, pending_payment, paid, fulfilled, cancelled] (Required, Non-nullable, Editable, Source of Truth: DB, Validation: OrderService)
* `total_amount`: Decimal (Required, Non-nullable, Editable, Source of Truth: DB, Validation: OrderService)
* `created_at`: Datetime (Required, Non-nullable, Read-only)
* `updated_at`: Datetime (Required, Non-nullable, Read-only)

### 6.2 OrderItem
* `id`: UUID (Required, Non-nullable, Read-only, Source of Truth: DB, Validation: DB)
* `order_id`: UUID/FK (Required, Non-nullable, Read-only, Source of Truth: DB, Validation: DB)
* `product_id`: UUID/FK (Required, Non-nullable, Read-only, Source of Truth: DB, Validation: DB)
* `quantity`: Integer (Required, Non-nullable, Read-only, Source of Truth: DB, Validation: OrderItemService)
* `product_name_snapshot`: String (Required, Non-nullable, Read-only, Source of Truth: DB, Validation: OrderItemService)
* `unit_price_snapshot`: Decimal (Required, Non-nullable, Read-only, Source of Truth: DB, Validation: OrderItemService)
* `line_total_snapshot`: Decimal (Required, Non-nullable, Read-only, Source of Truth: DB, Validation: OrderItemService)

## 7. Relationships
* **Request to Order:** One-to-One. A Request (of category `product_order`) has exactly one Order.
* **Order to OrderItem:** One-to-Many. An Order has one or more OrderItems.
* **OrderItem to Product:** Many-to-One. Forms the basis of the snapshot reference.

## 8. Indexes
* `Order.request_id`: Unique index to guarantee the 1:1 relationship.
* `Order.customer_id`: B-Tree index for customer-facing API lookups.
* `Order.status`: B-Tree index for background jobs (e.g., expiry scans).
* `OrderItem.order_id`: B-Tree index for retrieving line items for an order.

## 9. Constraints
* **Unique Constraints:** `Order.request_id` MUST be unique.
* **Referential Constraints:** `Order.customer_id` must validly reference a user. `OrderItem.order_id` must reference `Order.id`.
* **Business Constraints:** 
    * `status` MUST be restricted to `[created, pending_payment, paid, fulfilled, cancelled]`.
    * `OrderItem.quantity` MUST be > 0.
    * `Order.total_amount` MUST be >= 0.

## 10. Snapshot Fields
The following fields in `OrderItem` are explicitly defined as immutable snapshots captured at the exact moment of order creation:
* `unit_price_snapshot`: The price of a single unit.
* `line_total_snapshot`: Derived as `quantity * unit_price_snapshot`.
* `product_name_snapshot`: The name of the product.
Changes to the underlying Product Catalog will NEVER cascade to these fields.

## 11. Soft Delete Policy
* **Hard Delete:** Strictly forbidden for financial records (`Order`, `OrderItem`).
* **Soft Delete:** Not applicable. Records are transitioned to the `cancelled` state instead of being deleted.
* **Archive Behavior:** Orders persist indefinitely for financial traceability.

## 12. Validation Ownership
* **1:1 Request Enforcer:** Database Unique Constraint + `OrderService`.
* **Cancellation Blocks:** `OrderService` is strictly responsible for preventing the cancellation of any Order in the `paid` state.
* **Totals Calculation:** `OrderService` validates that `Order.total_amount` equals the sum of all `OrderItem.line_total_snapshot` values.

## 13. Audit Considerations
The following operations require high-risk audit logging:
* Any change to `Order.status` (especially manual administrative cancellations).
* The initial payload creation of `OrderItem` snapshots.

## 14. Open Questions
No unresolved model-design questions remain.

## 15. Completion Criteria
* Document solidifies the 1:1 mapping between Request and Order.
* The immutability of pricing snapshots is explicitly defined at the entity level.
* Financial record immutability (no deletions) is mandated.
