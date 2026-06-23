# Product Model Design

## 1. Purpose
The purpose of this document is to define the data models for the Product domain. It translates the architectural requirements of the Product Catalog and Inventory into strict physical data structures, defining entities, constraints, and validation ownership.

## 2. Scope
This document covers:
* `ProductCategory` entity.
* `Product` aggregate, including integrated inventory tracking.
* `ProductImage` entity.
* Data constraints, relationships, and indexing.

## 3. Out of Scope
* Django ORM code generation.
* Serializers and API view definitions.
* Variant matrices or SKU configurations.
* Dedicated Inventory aggregate (inventory is tracked directly on Product).

## 4. Dependencies
* **Product Service Architecture:** Dictates the actors authorized to mutate the models.
* **Order Domain:** Relies on Product data for snapshots.

## 5. Entity Inventory

### 5.1 ProductCategory
* **Purpose:** A first-class domain entity used to logically group products.
* **Ownership:** ProductService / CategoryService.
* **Lifecycle Participation:** Supports Active and Archived states. Archival cascades to all child Products.

### 5.2 Product
* **Purpose:** The core catalog aggregate storing metadata, flexible JSON attributes, and real-time inventory counts.
* **Ownership:** ProductService (Metadata) / InventoryService (Stock).
* **Lifecycle Participation:** Supports Active and Archived states. Archived products remain visible for historical contexts but cannot be added to new orders.

### 5.3 ProductImage
* **Purpose:** Stores pointers to product media.
* **Ownership:** ProductService.
* **Lifecycle Participation:** Tied to the lifecycle of the parent Product.

## 6. Field Definitions

### 6.1 ProductCategory
* `id`: UUID (Required, Non-nullable, Read-only, Source of Truth: DB, Validation: DB)
* `name`: String (Required, Non-nullable, Editable, Source of Truth: DB, Validation: DB)
* `slug`: String (Required, Non-nullable, Editable, Source of Truth: DB, Validation: DB)
* `description`: Text (Optional, Nullable, Editable, Source of Truth: DB, Validation: DB)
* `status`: String [active, archived] (Required, Non-nullable, Editable, Source of Truth: DB, Validation: CategoryService)

### 6.2 Product
* `id`: UUID (Required, Non-nullable, Read-only, Source of Truth: DB, Validation: DB)
* `category_id`: UUID/FK (Required, Non-nullable, Editable, Source of Truth: DB, Validation: DB)
* `name`: String (Required, Non-nullable, Editable, Source of Truth: DB, Validation: DB)
* `description`: Text (Optional, Nullable, Editable, Source of Truth: DB, Validation: DB)
* `attributes`: JSON (Optional, Nullable, Editable, Source of Truth: DB, Validation: ProductService)
* `unit_price`: Decimal (Required, Non-nullable, Editable, Source of Truth: DB, Validation: DB)
* `quantity_available`: Integer (Required, Non-nullable, Editable, Source of Truth: DB, Validation: InventoryService)
* `low_stock_threshold`: Integer (Required, Non-nullable, Editable, Source of Truth: DB, Validation: InventoryService)
* `status`: String [active, archived] (Required, Non-nullable, Editable, Source of Truth: DB, Validation: ProductService)

### 6.3 ProductImage
* `id`: UUID (Required, Non-nullable, Read-only, Source of Truth: DB, Validation: DB)
* `product_id`: UUID/FK (Required, Non-nullable, Read-only, Source of Truth: DB, Validation: DB)
* `image_url`: String (Required, Non-nullable, Editable, Source of Truth: Media Storage, Validation: DB)
* `order_index`: Integer (Required, Non-nullable, Editable, Source of Truth: DB, Validation: DB)

## 7. Relationships
* **ProductCategory to Product:** One-to-Many. A product belongs to exactly one category.
* **Product to ProductImage:** One-to-Many. A product has zero to many images.
* **Snapshot Ownership:** Order items maintain loose historical references (snapshots) to Products, but changes to Product do not cascade to Order Items.

## 8. Indexes
* `ProductCategory.slug`: Unique index for fast lookup.
* `Product.category_id`: B-Tree index to support category-based filtering.
* `Product.status`: B-Tree index to quickly filter out archived products from active queries.

## 9. Constraints
* **Unique Constraints:** `ProductCategory.slug` must be unique.
* **Referential Constraints:** `Product.category_id` references `ProductCategory.id`. `ProductImage.product_id` references `Product.id`.
* **Business Constraints:** 
    * `quantity_available` MUST be >= 0. (No backorders permitted).
    * `low_stock_threshold` MUST be >= 0.

## 10. Snapshot Fields
* None. The Product Domain is the source of truth for current prices and metadata. Snapshots are stored downstream in the Order Domain.

## 11. Soft Delete Policy
* **Hard Delete:** Strictly forbidden for `Product` and `ProductCategory`.
* **Soft Delete:** Implemented via the `status` field transition to `archived`.
* **Archive Behavior:** Archiving a category MUST automatically trigger the archival of all related products. Archived products cannot be added to orders but remain in the database for `OrderItem` referential integrity.

## 12. Validation Ownership
* **Max 4 Images:** `ProductService` is exclusively responsible for validating that a Product cannot exceed 4 `ProductImage` records.
* **Stock Validations:** `InventoryService` owns the logic ensuring `quantity_available` is sufficient before order creation.
* **Archival Cascade:** `CategoryService` orchestrates the cascading archive logic.

## 13. Audit Considerations
The following fields require strict audit visibility via the centralized audit log upon mutation:
* `Product.unit_price`
* `Product.quantity_available`
* `Product.low_stock_threshold`
* `Product.status`
* `ProductCategory.status`

## 14. Open Questions
No unresolved model-design questions remain.

## 15. Completion Criteria
* Document clearly defines `ProductCategory` as a first-class entity.
* Inventory fields are tightly bound to the Product model.
* Constraints guarantee that negative inventory (backorders) is blocked at the database level.
* Max 4 images rule is delegated to the Service layer.
