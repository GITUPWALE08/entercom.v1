# Product Service Implementation Design

## 1. Purpose
The purpose of this document is to define the concrete implementation responsibilities, transaction boundaries, and event orchestration for the Product Domain services. It establishes the strict rules governing catalog metadata management and authoritative inventory tracking.

## 2. Scope
This document covers:
* `ProductService`
* `CategoryService`
* `InventoryService`

## 3. Out of Scope
* Django ORM code generation.
* API ViewSet implementations.
* Order creation or fulfillment logic.
* Payment processing logic.

## 4. Dependencies
* **Product Domain Architecture**
* **Product Model Design**
* **Product Permissions Architecture**
* **Product Auditing Architecture**

## 5. Service Inventory

### 5.1 ProductService
* **Purpose:** Orchestrator for product metadata, attributes, and media constraints.
* **Ownership:** Product entity metadata and ProductImage entities.
* **Consumers:** API Views, OrderService (for pricing snapshots).
* **Dependencies:** CategoryService (validation).

### 5.2 CategoryService
* **Purpose:** Manager for the product classification hierarchy.
* **Ownership:** ProductCategory entity and archival cascade logic.
* **Consumers:** API Views, ProductService.
* **Dependencies:** None.

### 5.3 InventoryService
* **Purpose:** Authoritative engine for stock validation and depletion.
* **Ownership:** `quantity_available` and `low_stock_threshold` calculations.
* **Consumers:** API Views, OrderService.
* **Dependencies:** None (Standalone utility for Product entities).

## 6. Responsibilities & Ownership Rules

### 6.1 ProductService
* **Owns:** Product creation, updates, and archival. Enforcement of the maximum 4 images rule. Validation of JSON attributes.
* **Does NOT Own:** Inventory reductions, category hierarchy logic, pricing snapshots.

### 6.2 CategoryService
* **Owns:** Category creation, updates, and archival. Orchestrating the archival cascade to all child products.
* **Does NOT Own:** Individual product media or pricing.

### 6.3 InventoryService
* **Owns:** Stock validation (Hard Stock Checks). Mathematical reduction of `quantity_available`. Low stock threshold evaluation.
* **Does NOT Own:** Order cancellation, payment verification, or triggering the depletion process directly from webhooks.

## 7. Operation Specifications

### 7.1 Product Operations (ProductService)
* **Transaction Required:** Yes (for creation/updates involving images).
* **Why:** Atomic consistency between `Product` and `ProductImage` records.
* **Permission Enforcement:** `product.create`, `product.update`, `product.archive`. Staff+ for create/update; Manager+ for archive.
* **Audit Actions:** `product.created`, `product.updated`, `product.archived`. Requires actor metadata and state deltas.
* **Event Emission:** `product.created`, `product.updated`, `product.archived`. Emitted `on_commit`.

### 7.2 Category Operations (CategoryService)
* **Transaction Required:** Yes (specifically for archival).
* **Why:** Archiving a category MUST atomically archive all subordinate products.
* **Permission Enforcement:** `category.create`, `category.update`, `category.archive`. Staff+ for create/update; Manager+ for archive.
* **Audit Actions:** `category.created`, `category.updated`, `category.archived`.
* **Event Emission:** `category.created`, `category.updated`, `category.archived`. Emitted `on_commit`.

### 7.3 Inventory Validation (InventoryService)
* **Transaction Required:** No.
* **Why:** Read-only check evaluating `quantity_available` against requested quantity.
* **Permission Enforcement:** Inherited from calling service (OrderService).
* **Audit Actions:** None.
* **Event Emission:** None.

### 7.4 Inventory Reduction (InventoryService)
* **Transaction Required:** Yes.
* **Why:** Prevents race conditions. MUST use row-level locking (`select_for_update()`).
* **Permission Enforcement:** System-owned action (triggered exclusively via OrderService consuming `payment.paid`).
* **Audit Actions:** `inventory.reduced`. Requires `order_id`, `product_id`, and `correlation_id`.
* **Event Emission:** `inventory.reduced`. Evaluates low stock and conditionally emits `inventory.low_stock`. Emitted `on_commit`.

### 7.5 Inventory Adjustment (InventoryService)
* **Transaction Required:** Yes.
* **Why:** Atomic update of stock levels with audit trail.
* **Permission Enforcement:** `inventory.adjust`, `inventory.manage`. Manager+ only.
* **Audit Actions:** `inventory.adjusted`. Captures state delta and actor.
* **Event Emission:** `inventory.adjusted`. Emitted `on_commit`.

## 8. Cross-Service Interaction Matrix
* `ProductService` → calls → `CategoryService` (To validate category existence).
* `CategoryService` → calls → `ProductService` (To trigger product archival cascade).

## 9. Forbidden Interactions
* `ProductService` MUST NOT reduce inventory.
* `InventoryService` MUST NOT listen to payment events directly.

## 10. Failure Handling
* **Validation Failure:** Operations involving negative inventory or >4 images raise explicit Validation Errors.
* **Permission Failure:** Unauthorized attempts raise Permission Denied errors before business logic executes.
* **Concurrency Failure:** Concurrent inventory adjustments block at the database level and raise appropriate database timeout/conflict exceptions.

## 11. Open Questions
No unresolved service-layer questions remain.

## 12. Completion Criteria
* Inventory depletion is strictly isolated to `InventoryService` but orchestrated externally.
* Product image validation is localized to `ProductService`.
* Category archival cascade logic is properly transacted.
