# Product Service Implementation Design

## Purpose
To define the concrete implementation responsibilities, transaction boundaries, and event orchestration for the Product Domain services. It establishes the strict rules governing catalog metadata management and authoritative inventory tracking.

## Scope
* ProductService
* InventoryService
* CategoryService

## Out of Scope
* Django ORM code generation
* Serializers
* APIs
* Method implementations
* Order creation or fulfillment logic
* Payment processing logic

## Definitions
UNRESOLVED — BUSINESS DECISION REQUIRED

## Service Inventory
1. ProductService
2. InventoryService
3. CategoryService

## Detailed Service Sections

### 1. ProductService
#### Purpose
To act as the sole orchestrator for product metadata, flexible JSON attributes, and media constraints within the catalog.
#### Ownership
Data ownership of the `Product` entity metadata (name, description, attributes, unit_price) and all associated `ProductImage` entities.
#### Responsibilities
Manages the creation, modification, and archival of Products. Handles the creation and sequencing of ProductImages.
#### Inputs
Product metadata payloads, JSON attributes, image URLs, and actor metadata.
#### Outputs
Instantiated or updated `Product` and `ProductImage` domain entities.
#### Validations Owned
Validates that JSON attributes conform to the dynamic schema. Enforces the strict maximum of 4 images per product constraint.
#### Permissions Enforced
Enforces `product.create` and `product.update` (Staff+) and `product.archive` (Manager+).
#### Audit Actions Produced
Logs `product.created`, `product.updated`, and `product.archived`.
#### Events Produced
Emits `product.created`, `product.updated`, and `product.archived`.
#### Transaction Boundaries
Requires atomic database transactions when modifying a Product and its ProductImages simultaneously.
#### Cross-Service Dependencies
Calls `CategoryService` to validate category existence before product creation.
#### Forbidden Responsibilities
MUST NOT reduce inventory, perform stock math, or manage category hierarchies.
#### Failure Handling
Raises explicit Validation Errors when attempting to attach >4 images.
#### Idempotency Requirements
Standard REST PUT/PATCH idempotency on metadata updates.
#### Completion Criteria
Image constraint validation is entirely encapsulated. Metadata operations are transactional and properly audited.

### 2. InventoryService
#### Purpose
To act as the authoritative engine for stock validation, depletion, and low-stock threshold evaluation.
#### Ownership
Data ownership of the `quantity_available` and `low_stock_threshold` fields on the Product model. Owns inventory mutation.
#### Responsibilities
Performs read-only mathematical checks for stock validation. Mathematically reduces stock levels based on successful payment workflows. Handles administrative stock adjustments.
#### Inputs
Product ID, reduction quantity, actor metadata, and correlation ID.
#### Outputs
Boolean validation results (for checks). Updated `quantity_available` state.
#### Validations Owned
Exclusively responsible for preventing negative inventory (backorders) by validating `quantity_available` >= requested quantity.
#### Permissions Enforced
Administrative adjustments enforce `inventory.adjust` and `inventory.manage` (Manager+). Reductions are System-owned.
#### Audit Actions Produced
Logs `inventory.reduced` and `inventory.adjusted`.
#### Events Produced
Emits `inventory.reduced` and `inventory.adjusted`. Conditionally emits `inventory.low_stock`.
#### Transaction Boundaries
**Inventory Reduction Transaction:** Reductions and adjustments MUST use row-level database locking (`select_for_update()`) within an atomic transaction.
#### Cross-Service Dependencies
None.
#### Forbidden Responsibilities
InventoryService never owns orders. InventoryService never owns payments. MUST NOT listen to payment events directly. MUST NOT cancel orders.
#### Failure Handling
Raises explicit database lock timeouts or Validation Errors if concurrent reductions cause stock to drop below zero.
#### Idempotency Requirements
Reductions require a correlation ID to prevent double-depletion.
#### Completion Criteria
Row-level locks completely eliminate negative inventory race conditions.

### 3. CategoryService
#### Purpose
To manage the product classification hierarchy.
#### Ownership
Data ownership of the `ProductCategory` entity.
#### Responsibilities
Handles creation and updates of categories. Orchestrates the archival cascade logic to subordinate products.
#### Inputs
Category name, slug, description payloads, and actor metadata.
#### Outputs
Instantiated or updated `ProductCategory` domain entities.
#### Validations Owned
Validates the uniqueness of the category slug.
#### Permissions Enforced
Enforces `category.create` and `category.update` (Staff+) and `category.archive` (Manager+).
#### Audit Actions Produced
Logs `category.created`, `category.updated`, and `category.archived`.
#### Events Produced
Emits `category.created`, `category.updated`, and `category.archived`.
#### Transaction Boundaries
Archival processes are wrapped in a strict transaction.
#### Cross-Service Dependencies
None.
#### Forbidden Responsibilities
MUST NOT manipulate individual product media or pricing.
#### Failure Handling
Blocks creation and raises Validation Errors if a duplicate slug is detected.
#### Idempotency Requirements
Archival requests on already archived categories must cleanly acknowledge without side effects.
#### Completion Criteria
Archival cascade logic is perfectly transactional.

## Transaction Matrix
* **Inventory Reduction Transaction:** Defined in InventoryService.
* **Product Modification:** Defined in ProductService.
* **Category Archival:** Defined in CategoryService.

## Ownership Matrix
* **ProductService:** Product metadata, ProductImage.
* **InventoryService:** inventory mutation, `quantity_available`, `low_stock_threshold`.
* **CategoryService:** ProductCategory.

## Forbidden Interactions
* InventoryService MUST NOT emit order events.
* InventoryService MUST NOT emit payment events.

## Dependencies
* docs/architecture/product/product-domain.md
* docs/architecture/product/product-services.md
* docs/architecture/product/product-events.md
* docs/architecture/product/product-permissions.md
* docs/architecture/product/product-auditing.md
* docs/workflows/product-order-flow.md
* docs/implementation/product/product-model-design.md

## Open Questions
UNRESOLVED — BUSINESS DECISION REQUIRED

## Completion Criteria
UNRESOLVED — BUSINESS DECISION REQUIRED
