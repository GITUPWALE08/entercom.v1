# Product API Design

## Purpose
To define the REST API contracts, endpoints, and validation boundaries for the Product Domain in Phase 5.

## Scope
* Category endpoints
* Product endpoints
* Inventory endpoints

## Out of Scope
* Django ORM code generation
* Serializer class implementation
* API view logic
* DRF routers

## Endpoint Inventory

| Endpoint | Method | Permission | Service |
| -------- | ------ | ---------- | ------- |
| `/api/v1/product-categories/` | GET | `category.view` | CategoryService |
| `/api/v1/product-categories/{id}/` | GET | `category.view` | CategoryService |
| `/api/v1/product-categories/` | POST | `category.create` | CategoryService |
| `/api/v1/product-categories/{id}/` | PATCH | `category.update` | CategoryService |
| `/api/v1/product-categories/{id}/archive/` | POST | `category.archive` | CategoryService |
| `/api/v1/products/` | GET | `product.view` | ProductService |
| `/api/v1/products/{id}/` | GET | `product.view` | ProductService |
| `/api/v1/products/` | POST | `product.create` | ProductService |
| `/api/v1/products/{id}/` | PATCH | `product.update` | ProductService |
| `/api/v1/products/{id}/archive/` | POST | `product.archive` | ProductService |
| `/api/v1/products/{id}/inventory-adjust/` | POST | `inventory.adjust` | InventoryService |

## Serializer Inventory
* `ProductCategorySerializer`
* `ProductListSerializer`
* `ProductDetailSerializer`
* `InventoryAdjustmentSerializer`

## Filters
* `category_id` (Products)
* `state` (Products)

## Pagination
Use standard platform pagination conventions.
* `page`
* `page_size`

## Payload Contracts
UNRESOLVED — BUSINESS DECISION REQUIRED for precise required and optional fields.

*Example Payload Contract (Structure Only):*

| Field | Required | Type | Notes |
| ----- | -------- | ---- | ----- |
| UNRESOLVED | UNRESOLVED | UNRESOLVED | UNRESOLVED |

## Validation Ownership
* **Request Validation (Structure):** API Layer (Serializers)
* **Business Validation (Rules):** Service Layer (`ProductService`, `CategoryService`, `InventoryService`)
Controllers remain thin.

## Permission Matrix

| Endpoint | Required Permission |
| -------- | ------------------- |
| `GET /api/v1/product-categories/` | `category.view` |
| `GET /api/v1/product-categories/{id}/` | `category.view` |
| `POST /api/v1/product-categories/` | `category.create` |
| `PATCH /api/v1/product-categories/{id}/` | `category.update` |
| `POST /api/v1/product-categories/{id}/archive/` | `category.archive` |
| `GET /api/v1/products/` | `product.view` |
| `GET /api/v1/products/{id}/` | `product.view` |
| `POST /api/v1/products/` | `product.create` |
| `PATCH /api/v1/products/{id}/` | `product.update` |
| `POST /api/v1/products/{id}/archive/` | `product.archive` |
| `POST /api/v1/products/{id}/inventory-adjust/` | `inventory.adjust` |

## Forbidden Endpoints
Explicitly prohibit:
* `PATCH /products/{id}/reduce-inventory/`
* Any endpoint bypassing Service Layer ownership.

## Dependencies
* docs/architecture/product/product-domain.md
* docs/architecture/product/product-services.md
* docs/architecture/product/product-permissions.md
* docs/implementation/product/product-service-design.md
* docs/implementation/product/product-permission-mapping.md

## Open Questions
UNRESOLVED — BUSINESS DECISION REQUIRED

## Completion Criteria
UNRESOLVED — BUSINESS DECISION REQUIRED
