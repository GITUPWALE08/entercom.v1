# Product Permissions Architecture

## 1. Purpose
The purpose of this document is to define the Role-Based Access Control (RBAC) boundaries for the Product Domain within the Entercom platform. It establishes the permissions governing the viewing, creation, modification, and archiving of Products and Categories, as well as the strict administrative boundaries around Inventory management.

## 2. Scope
This document covers:
* RBAC permissions for Product metadata and media.
* RBAC permissions for Category hierarchy management.
* RBAC permissions for Inventory tracking and manual adjustment.
* Role-specific matrices for Customers, Staff, Managers, and Superadmins.

## 3. Out of Scope
* Permissions for Order creation or Fulfillment (Covered in Order Permissions).
* Permissions for Payment processing (Covered in Payment Permissions).
* Technical implementation details (e.g., API decorators, database schema).
* Management of physical warehouses or supplier access.

## 4. Definitions
* **Permission:** A discrete, authorized action granted to a specific role within the system.
* **Ownership:** The bounding context that determines whether a user can perform an action (e.g., global catalog vs. specific user record).
* **Archival:** The administrative action of deactivating a product or category, preventing new usage while preserving historical integrity.

## 5. Permission Inventory

### 5.1 Product Permissions
* `product.view`
* `product.create`
* `product.update`
* `product.archive`

### 5.2 Category Permissions
* `category.view`
* `category.create`
* `category.update`
* `category.archive`

### 5.3 Inventory Permissions
* `inventory.view`
* `inventory.adjust`
* `inventory.manage`

## 6. Role Matrix

| Action | Customer | Staff | Manager | Superadmin |
| :--- | :---: | :---: | :---: | :---: |
| `product.view` | ALLOW | ALLOW | ALLOW | ALLOW |
| `product.create` | DENY | ALLOW | ALLOW | ALLOW |
| `product.update` | DENY | ALLOW | ALLOW | ALLOW |
| `product.archive` | DENY | DENY | ALLOW | ALLOW |
| `category.view` | ALLOW | ALLOW | ALLOW | ALLOW |
| `category.create` | DENY | ALLOW | ALLOW | ALLOW |
| `category.update` | DENY | ALLOW | ALLOW | ALLOW |
| `category.archive` | DENY | DENY | ALLOW | ALLOW |
| `inventory.view` | DENY | ALLOW | ALLOW | ALLOW |
| `inventory.adjust` | DENY | DENY | ALLOW | ALLOW |
| `inventory.manage` | DENY | DENY | ALLOW | ALLOW |

## 7. Permission Specifications

### 7.1 `product.view` & `category.view`
* **Purpose:** Allows actors to browse the active catalog.
* **Scope:** Global across all active products and categories.
* **Restrictions:** Archived products ARE visible to Customers, but cannot be added to orders. Frontend may optionally hide them.
* **Ownership:** N/A (Global Read).

### 7.2 `product.create` & `category.create`
* **Purpose:** Allows initialization of new catalog entities.
* **Scope:** Global.
* **Restrictions:** Strictly denied to Customers.
* **Ownership:** System/Catalog level.

### 7.3 `product.update` & `category.update`
* **Purpose:** Allows modification of existing catalog metadata and media.
* **Scope:** Global.
* **Restrictions:** Strictly denied to Customers. Cannot be used to archive items.
* **Ownership:** System/Catalog level.

### 7.4 `product.archive` & `category.archive`
* **Purpose:** Safely deactivates catalog items without deleting historical data.
* **Scope:** Global.
* **Restrictions:** Restricted to Managers and Superadmins to prevent accidental catalog destruction.
* **Ownership:** System/Catalog level.

### 7.5 `inventory.view`
* **Purpose:** Allows viewing of raw `quantity_available` and `low_stock_threshold` values.
* **Scope:** Global across all products.
* **Restrictions:** Strictly denied to Customers. Customers only see derived states (e.g., "In Stock" vs "Out of Stock").
* **Ownership:** System/Catalog level.

### 7.6 `inventory.adjust` & `inventory.manage`
* **Purpose:** Allows manual reconciliation of stock counts and threshold configurations.
* **Scope:** Global across all products.
* **Restrictions:** Restricted to Managers and Superadmins. Must produce an `inventory.adjusted` audit event.
* **Ownership:** System/Catalog level.

## 8. Ownership Matrix
* **Product Catalog:** System-owned. No individual user owns a product.
* **Category Hierarchy:** System-owned.
* **Inventory Counts:** System-owned.

## 9. Transition Ownership Matrix
*(Note: Products and Categories use standard CRUD rather than complex state machines. See Order/Payment documents for formal transition matrices).*

## 10. Restrictions & Security Requirements
* **Customer Isolation:** Customers MUST NOT have any ability to modify product metadata, categories, or inventory counts.
* **Archive Protection:** Only Manager and Superadmin roles possess the destructive capability to archive products or categories.

## 11. Dependencies
* **Product Domain Architecture:** Provides the underlying entities being secured.
* **Order Domain:** Consumes the catalog via `product.view` for order generation.

## 12. Open Questions
* None at this time.

## 13. Completion Criteria
* RBAC matrix explicitly maps all Product, Category, and Inventory permissions to approved roles.
* Customer catalog access is strictly read-only.
* Administrative tiers between Staff and Management are clearly defined for archival and inventory tasks.
