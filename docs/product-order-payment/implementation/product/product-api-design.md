# Product API Design

## 1. Purpose
The purpose of this document is to define the RESTful external interfaces for the Product Domain. It provides the strict contract for catalog browsing and administrative catalog management, ensuring that all API endpoints correctly map to underlying services and enforce role-based access controls.

## 2. Scope
This document covers:
* Product browsing endpoints (`GET`).
* Category browsing endpoints (`GET`).
* Administrative catalog management endpoints (`POST`, `PATCH`).
* Request/Response schemas, filtering, and validation ownership.

## 3. Out of Scope
* Direct inventory mutation endpoints (Inventory reductions are orchestrated by OrderService).
* DRF code generation.
* Serializer implementation details.

## 4. Dependencies
* **Product Service Architecture:** Provides the backend logic for these endpoints.
* **Product Permission Mapping:** Defines the `Can*` rules enforced at the controller.
* **Product Model Design:** Informs the structure of the JSON payloads.

## 5. Base URL
`/api/v1/`

## 6. Endpoint Inventory

| HTTP | Path | Purpose | Required Permission | Service Called |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/products/` | List products | `product.view` | `ProductService.list_products` |
| `GET` | `/products/{id}/` | Retrieve product | `product.view` | `ProductService.get_product` |
| `POST` | `/products/` | Create product | `product.create` | `ProductService.create_product` |
| `PATCH`| `/products/{id}/` | Update product | `product.update` / `product.archive` | `ProductService.update_product` / `archive_product` |
| `GET` | `/categories/` | List categories | `category.view` | `CategoryService.list_categories` |
| `GET` | `/categories/{id}/` | Retrieve category | `category.view` | `CategoryService.get_category` |
| `POST` | `/categories/` | Create category | `category.create`| `CategoryService.create_category` |
| `PATCH`| `/categories/{id}/`| Update category | `category.update` / `category.archive` | `CategoryService.update_category` / `archive_category` |

## 7. Payloads

### 7.1 Product Payloads

#### Create/Update Product Request
* **Required Fields:** `name` (String), `category_id` (UUID), `unit_price` (Decimal).
* **Optional Fields:** `description` (String), `attributes` (JSON), `images` (List of URLs, Max 4), `status` (String: active/archived - restricted to Manager/Superadmin).

#### Product Response
* **Structure:** `id`, `name`, `category_id`, `description`, `attributes`, `unit_price`, `status`, `quantity_available` (derived/masked for Customers), `images` (Array).
* **Note:** Archived products must indicate they are not purchasable (e.g., via `status: "archived"`).

### 7.2 Category Payloads

#### Create/Update Category Request
* **Required Fields:** `name` (String), `slug` (String).
* **Optional Fields:** `description` (String), `status` (String: active/archived - restricted to Manager/Superadmin).

#### Category Response
* **Structure:** `id`, `name`, `slug`, `description`, `status`.

## 8. Filter Design
* **Products:** `category_id`, `is_active` (Boolean), `is_archived` (Boolean).
* **Categories:** `is_active` (Boolean).
* **Ordering:** Standard fields (e.g., `name`, `created_at`).

## 9. Pagination Design
* **Type:** Limit/Offset or Page Number.
* **Default Page Size:** 20.
* **Maximum Page Size:** 100.

## 10. Validation Ownership
* **Serializer Validation:** Payload shape, required field presence, data types (e.g., valid UUID, valid Decimal).
* **Service Validation:** Enforcement of max 4 images rule (`ProductService`), unique slug checks (`CategoryService`), archival cascade logic (`CategoryService`).
* **Permission Validation:** Controller checks `product.create`, `product.update`, etc., prior to service invocation.

## 11. Error Responses
* `400 Bad Request`: Validation failure (e.g., missing required fields, exceeding 4 image URLs).
* `401 Unauthorized`: Missing or invalid authentication token.
* `403 Forbidden`: Insufficient role for administrative endpoints (e.g., Customer attempting `POST /products/`).
* `404 Not Found`: Product or Category UUID does not exist.
* `409 Conflict`: Attempting to create a category with an existing slug.

## 12. Service Routing Matrix
* `GET /products/` → ORM Queryset (Filtered by `is_active`/`is_archived`)
* `POST /products/` → `ProductService.create_product()`
* `PATCH /products/{id}/` → `ProductService.update_product()` (or `archive_product()` if status changed to archived)
* `GET /categories/` → ORM Queryset
* `POST /categories/` → `CategoryService.create_category()`
* `PATCH /categories/{id}/` → `CategoryService.update_category()` (or `archive_category()`)

## 13. Forbidden API Behavior
* Explicitly prohibit: Direct inventory mutation via catalog endpoints. (No `PATCH /products/{id}/quantity/` exposed here; handled by `InventoryService` internally).

## 14. Open Questions
No unresolved API design questions remain.

## 15. Completion Criteria
* Endpoints cleanly separate read-only catalog browsing from administrative management.
* Constraints (max 4 images, JSON attributes) are reflected in the expected payload documentation.
* The API enforces the `archived` visibility rules.
