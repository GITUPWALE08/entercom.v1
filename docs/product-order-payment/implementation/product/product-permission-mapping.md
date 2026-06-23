# Product Permission Mapping Design

## 1. Purpose
The purpose of this document is to translate the architectural permissions defined in the Product Domain into strict, executable implementation rules. It maps domain-level Role-Based Access Control (RBAC) to specific Service actions, establishing exact authorization boundaries for catalog and inventory management.

## 2. Scope
This document covers:
* `ProductService` permission mappings.
* `CategoryService` permission mappings.
* `InventoryService` permission mappings.
* Role-specific execution limits for Customers, Staff, Managers, and Superadmins.

## 3. Out of Scope
* Order creation or fulfillment permissions.
* Payment initialization or state change permissions.
* Python/Django code generation for permission classes.

## 4. Dependencies
* **Product Permissions Architecture**
* **Product Service Implementation Design**

## 5. Role Matrix
The following roles are authorized within the Product domain:
* **Customer:** Read-only access to active and archived catalog items.
* **Staff:** Catalog creation and updates; read-only inventory.
* **Manager:** Full catalog management including archival; full inventory management.
* **Superadmin:** Full platform access.

## 6. Permission Inventory
* `product.view`: Purpose: View catalog. Owning Service: ProductService. Domain: Product.
* `product.create`: Purpose: Create items. Owning Service: ProductService. Domain: Product.
* `product.update`: Purpose: Modify items. Owning Service: ProductService. Domain: Product.
* `product.archive`: Purpose: Deactivate items. Owning Service: ProductService. Domain: Product.
* `category.view`: Purpose: View categories. Owning Service: CategoryService. Domain: Product.
* `category.create`: Purpose: Create categories. Owning Service: CategoryService. Domain: Product.
* `category.update`: Purpose: Modify categories. Owning Service: CategoryService. Domain: Product.
* `category.archive`: Purpose: Deactivate categories. Owning Service: CategoryService. Domain: Product.
* `inventory.view`: Purpose: View stock levels. Owning Service: InventoryService. Domain: Product.
* `inventory.adjust`: Purpose: Modify stock manually. Owning Service: InventoryService. Domain: Product.
* `inventory.manage`: Purpose: Modify threshold rules. Owning Service: InventoryService. Domain: Product.

## 7. Permission Mapping Matrix

| Permission | Service Action | Allowed Roles | Restrictions |
| :--- | :--- | :--- | :--- |
| `product.view` | `ProductService.list_products()` | Customer, Staff, Manager, Superadmin | Archived products visible but cannot be ordered. |
| `product.create` | `ProductService.create_product()` | Staff, Manager, Superadmin | Maximum 4 images enforcement. |
| `product.update` | `ProductService.update_product()` | Staff, Manager, Superadmin | Cannot be used to archive. |
| `product.archive`| `ProductService.archive_product()` | Manager, Superadmin | N/A |
| `category.view` | `CategoryService.list_categories()`| Customer, Staff, Manager, Superadmin | N/A |
| `category.create`| `CategoryService.create_category()`| Staff, Manager, Superadmin | N/A |
| `category.update`| `CategoryService.update_category()`| Staff, Manager, Superadmin | Cannot be used to archive. |
| `category.archive`| `CategoryService.archive_category()`| Manager, Superadmin | Automatically archives child products. |
| `inventory.view` | `InventoryService.get_stock()` | Staff, Manager, Superadmin | Customer views derived stock only. |
| `inventory.adjust`| `InventoryService.adjust_inventory()`| Manager, Superadmin | Triggers audit. |
| `inventory.manage`| `InventoryService.update_threshold()`| Manager, Superadmin | Triggers audit. |

## 8. Ownership Rules
* **Who grants access:** Superadmins via Role assignments.
* **Who enforces access:** API Permission Classes (HTTP layer) and Service-level decorators/checks (Business layer).
* **Who audits access:** The Audit subsystem captures mutations and permission failures.

## 9. IDOR Protection Requirements
For the Product domain, data is largely globally scoped (system-owned). However:
* **Ownership Validation Required:** No (Global Catalog).
* **Validation Location:** API ViewSet filters.
* **Failure Result:** N/A for viewing; `403 Forbidden` for unauthorized mutation attempts by Customers.

## 10. Service Enforcement Matrix

| Service | Action | Required Permission |
| :--- | :--- | :--- |
| `ProductService` | `create_product` | `product.create` |
| `ProductService` | `update_product` | `product.update` |
| `ProductService` | `archive_product`| `product.archive` |
| `CategoryService` | `create_category`| `category.create` |
| `CategoryService` | `update_category`| `category.update` |
| `CategoryService` | `archive_category`| `category.archive` |
| `InventoryService`| `adjust_inventory`| `inventory.adjust` |
| `InventoryService`| `update_threshold`| `inventory.manage` |

## 11. Restriction Matrix
* **Archived Product Restrictions:** Customers MAY view archived products for historical context. Customers MAY NOT place orders containing archived products.
* **Manager Overrides:** `inventory.adjust` is restricted to Manager/Superadmin to prevent standard Staff from bypassing financial controls.

## 12. Permission Audit Requirements
* `product.create`: Audit Required (Yes), Action (`product.created`), Metadata (Actor ID).
* `product.update`: Audit Required (Yes), Action (`product.updated`), Metadata (State Delta).
* `product.archive`: Audit Required (Yes), Action (`product.archived`), Metadata (Actor ID).
* `category.created/updated/archived`: Audit Required (Yes), Action (`category.*`), Metadata (Actor ID, Delta).
* `inventory.adjust`: Audit Required (Yes), Action (`inventory.adjusted`), Metadata (Quantity Before/After, Actor ID).

## 13. Cross-Domain Permission Rules
* **Order domain permissions never authorize:** Product administration or Inventory adjustment.
* **Payment domain permissions never authorize:** Product administration or Inventory adjustment.
* **Request domain permissions never authorize:** Product administration or Inventory adjustment.

## 14. Open Questions
No unresolved permission-mapping questions remain.

## 15. Completion Criteria
* Service actions are strictly mapped to documented permissions.
* Customer catalog access is defined as read-only.
* Administrative tiers (Staff vs. Manager) are explicitly separated for archival and inventory actions.
