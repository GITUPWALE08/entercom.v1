# Product Permission Mapping Design

## Purpose
To map permissions to service actions, allowed roles, restrictions, and ownership rules within the Product Domain for Phase 5.

## Scope
* ProductService
* CategoryService
* InventoryService

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
* `product.view`
* `product.create`
* `product.update`
* `product.archive`
* `category.view`
* `category.create`
* `category.update`
* `category.archive`
* `inventory.view`
* `inventory.adjust`
* `inventory.manage`

## Permission Mapping Matrix

| Permission | Service | Action | Roles | Restrictions |
| ---------- | ------- | ------ | ----- | ------------ |
| `product.view` | ProductService | list_products / get_product | Customer, Staff, Manager, Superadmin | Archived products visible to customers but not orderable |
| `product.create` | ProductService | create_product | Staff, Manager, Superadmin | None |
| `product.update` | ProductService | update_product | Staff, Manager, Superadmin | None |
| `product.archive` | ProductService | archive_product | Manager, Superadmin | None |
| `category.view` | CategoryService | list_categories / get_category | Customer, Staff, Manager, Superadmin | None |
| `category.create` | CategoryService | create_category | Staff, Manager, Superadmin | None |
| `category.update` | CategoryService | update_category | Staff, Manager, Superadmin | None |
| `category.archive` | CategoryService | archive_category | Manager, Superadmin | None |
| `inventory.view` | InventoryService | view_inventory | Staff, Manager, Superadmin | None |
| `inventory.adjust` | InventoryService | adjust_inventory | Staff, Manager, Superadmin | Customer prohibited |
| `inventory.manage` | InventoryService | manage_inventory | Manager, Superadmin | None |

## Restrictions
* Archived products visible to customers but not orderable.
* Customers are strictly prohibited from adjusting inventory.

## Ownership Validation Rules
Products, Categories, and Inventory are global system resources. They are not customer-owned.
* UNRESOLVED — BUSINESS DECISION REQUIRED (If specific vendor ownership applies in future).

## IDOR Protection Rules
Not applicable for public catalog read access. Modification access is protected by Role bindings (Staff/Manager/Superadmin) rather than resource ownership.

## Forbidden Actions
* **Customers MUST NOT:**
  * adjust inventory
  * archive products
* **Staff MUST NOT:**
  * archive products (requires Manager+)
  * archive categories (requires Manager+)

## Dependencies
* docs/architecture/product/product-permissions.md
* docs/architecture/product/product-services.md
* docs/implementation/product/product-service-design.md

## Completion Criteria
UNRESOLVED — BUSINESS DECISION REQUIRED
