# Product Domain Architecture

## 1. Purpose
The purpose of this document is to define the architectural boundaries, rules, and lifecycle of the Product Catalog and Inventory within the Entercom platform. It establishes how product metadata is managed and how availability is tracked to support the commerce lifecycle.

## 2. Scope
This document covers:
* Product catalog management.
* ProductCategory domain entity.
* Metadata and attribute storage (JSON).
* Media management constraints (Max 4 images).
* Inventory tracking (integrated within the Product aggregate).
* Stock availability and depletion policies.
* Visibility and archival rules.

## 3. Out of Scope
* Variant system, SKU matrix, or option combinations.
* Warehousing and multiple bin locations.
* Supplier and purchase order management.
* Shipping and logistics tracking.
* Product reviews and social ratings.
* Bundles or kits (composite products).
* Returns and physical stock reconciliation workflows.
* Videos or external media types.

## 4. Definitions
* **Product Aggregate:** The authoritative entity containing both descriptive metadata and real-time inventory counts.
* **ProductCategory:** A first-class domain entity to which products belong.
* **Low Stock Threshold:** A configurable numeric value per product that triggers administrative alerts.
* **Hard Stock Constraint:** The rule that order creation MUST fail if requested quantity exceeds available quantity.
* **Archival:** A state where a product or category is preserved for historical reference but is no longer discoverable or purchasable.

## 5. Ownership & Authority
* **Product Management:** Create, Update, and Archive permissions are restricted to Staff, Manager, and Superadmin roles. Customers hold zero authority over product metadata.
* **Category Management:** Create, Update, and Archive permissions are restricted to Staff, Manager, and Superadmin roles.
* **Inventory Authority:** The System is the final authority on stock counts. Administrative overrides are permitted for Staff/Manager roles but must be audited.

## 6. Lifecycle
### 6.1 Product Lifecycle
1. **Active:** Visible and purchasable if stock is available.
2. **Archived:** Visible to Customers for historical reference, but cannot be added to new orders. Persists for historical integrity.

### 6.2 Category Lifecycle
1. **Active:** Visible; contains active products.
2. **Inactive:** Hidden; products remain but are not discoverable via the category. Archiving a Category automatically archives all Products in that Category.

## 7. Product Attributes & Media
* **Attribute Schema:** Product-specific specifications are stored as a flexible JSON structure. No SKU matrix or option combinations are supported in Phase 5.
* **Media Rules:**
    * Maximum of 4 images per product.
    * No videos or external media types.

## 8. Inventory & Stock Policies
* **Aggregate Integration:** `quantity_available` and `low_stock_threshold` are tracked directly on the Product entity.
* **Strict Availability:**
    * **No Reservations:** Stock is not reserved during order creation.
    * **No Backorders:** If stock is insufficient, order creation is rejected.
* **Stock Depletion Rule:** Inventory is reduced ONLY when a payment becomes `PAID`. This reduction must occur atomically within the payment success transaction.
* **Insufficient Stock Post-Payment:** If inventory becomes insufficient between order creation and payment completion, the order fulfillment must be blocked and requires manager intervention.

## 9. Audit Requirements
The system MUST capture:
* Every manual adjustment to `quantity_available`.
* Every state transition for Products and Categories.
* Changes to product price (captured as historical events).
* Creation and deletion of categories.

## 10. Dependencies
* **Order Domain:** Consumes Product availability for validation and captures price snapshots.
* **Payment Domain:** Triggers the inventory reduction event within its success transaction.

## 11. Completion Criteria
* ProductCategory entity exists and supports 1:N relationship with Products.
* Inventory fields exist on Product and support atomic depletion.
* Administrative boundaries prevent unauthorized modification of the catalog.
* Media constraints are enforced at the architectural level.
