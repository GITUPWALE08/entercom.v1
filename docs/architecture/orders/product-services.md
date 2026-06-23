# Product Service Architecture

## 1. Purpose
The purpose of this document is to define the logical service boundaries and responsibilities for managing Products, Categories, and Inventory within the Entercom platform. It establishes how business logic is encapsulated to ensure catalog integrity and authoritative stock management.

## 2. Scope
This document covers:
* **ProductService:** Management of product metadata, attributes, and media.
* **CategoryService:** Management of the product classification hierarchy.
* **InventoryService:** Authoritative stock validation, adjustment, and depletion logic.

## 3. Out of Scope
* Physical warehouse management or bin location tracking.
* Supplier procurement workflows.
* External marketplace synchronization.
* Frontend catalog presentation logic.

## 4. Definitions
* **Service Boundary:** The logical encapsulation of related business rules ensuring that only authorized services can mutate specific domain data.
* **Stock Depletion:** The authoritative reduction of available quantity, strictly triggered by financial settlement.
* **Snapshot:** An immutable copy of product data (specifically price) used by the Order domain.

## 5. Service Inventory

### 5.1 ProductService
* **Purpose:** Acts as the primary orchestrator for product metadata and lifecycle management.
* **Responsibilities:**
    * **Create Product:** Initialize new catalog entries with name, description, and initial pricing.
    * **Update Product:** Modify existing metadata.
    * **Archive Product:** Transition products to a non-discoverable state while preserving referential integrity.
    * **Manage Product Media:** ProductService owns image count validation and enforces the maximum 4 images per product rule.
    * **Manage Product Attributes:** Maintain flexible product specifications stored as JSON metadata.
* **Inputs:** Product metadata, JSON attributes, Media pointers.
* **Outputs:** Product aggregate state.
* **Events Produced:** `product.created`, `product.updated`, `product.archived`.

### 5.2 CategoryService
* **Purpose:** Manages the ProductCategory entity to provide structure to the catalog.
* **Responsibilities:**
    * **Create Category:** Define new top-level categories (name, slug, description).
    * **Update Category:** Modify category metadata.
    * **Archive Category:** Mark categories as inactive. Archiving a category automatically archives all products within it.
* **Inputs:** Category metadata.
* **Outputs:** Category state.
* **Events Produced:** `category.created`, `category.updated`, `category.archived`.

### 5.3 InventoryService
* **Purpose:** The sole authoritative engine for tracking and mutating product availability.
* **Responsibilities:**
    * **Validate Stock:** Perform "Hard Stock Checks" during order creation to prevent overselling.
    * **Reduce Inventory:** Atomically decrement `quantity_available`. InventoryService.reduce_inventory() is called exclusively by OrderService.
    * **Adjust Inventory:** Allow Staff/Managers to manually reconcile stock levels.
    * **Evaluate Low Stock:** Monitor levels against `low_stock_threshold` and flag for administrative review.
* **Inputs:** Product ID, Quantity delta, Actor ID.
* **Outputs:** Updated availability state, Validation results.
* **Events Produced:** `inventory.reduced`, `inventory.adjusted`, `inventory.low_stock_detected`.

## 6. Ownership Boundaries
* **The "Paid" Rule:** **Inventory reduction occurs ONLY after a payment reaches the `paid` state.** OrderService orchestrates this by calling InventoryService.reduce_inventory().
* **Catalog Control:** Only ProductService and CategoryService may mutate catalog metadata; InventoryService is restricted to quantity fields.

## 7. Event Responsibilities
Services must emit domain events for all successful mutations to support downstream synchronization (e.g., Audit logs, future Notifications).

## 8. Audit Responsibilities
* **ProductService:** Capture actor and timestamp for all metadata changes.
* **InventoryService:** Capture every quantity adjustment (automatic or manual), including previous and new values, correlation IDs, and actor identifiers.

## 9. Dependencies
* **Order Domain:** Relies on InventoryService for pre-order validation.
* **Payment Domain:** Provides the authoritative trigger for InventoryService stock reduction.

## 10. Open Questions
* **UNRESOLVED — BUSINESS DECISION REQUIRED:** Should InventoryService prevent manual stock adjustments if the new value would be lower than the sum of all currently `pending_payment` orders?

## 11. Completion Criteria
* Services are logically decoupled with zero overlapping mutation logic.
* The mandatory coupling between Payment Success and Stock Reduction is codified.
* Administrative roles (Staff, Manager, Superadmin) are established as the only authorized actors for catalog mutations.
