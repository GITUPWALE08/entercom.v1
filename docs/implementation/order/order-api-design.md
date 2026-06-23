# Order API Design

## Purpose
To define the REST API contracts, endpoints, and validation boundaries for the Order Domain in Phase 5.

## Scope
* Order endpoints

## Out of Scope
* Django ORM code generation
* Serializer class implementation
* API view logic
* DRF routers

## Endpoint Inventory

| Endpoint | Method | Permission | Service |
| -------- | ------ | ---------- | ------- |
| `/api/v1/orders/` | POST | `order.create` | OrderService |
| `/api/v1/orders/` | GET | `order.view_own` / `order.view` | OrderService |
| `/api/v1/orders/{id}/` | GET | `order.view_own` / `order.view` | OrderService |
| `/api/v1/orders/{id}/cancel/` | POST | `order.cancel` | OrderService |
| `/api/v1/orders/{id}/fulfill/` | POST | `order.fulfill` | OrderService |

*Note on Restrictions: Customer sees only own orders via `order.view_own`. Staff/Manager/Superadmin use `order.view`.*

## Serializer Inventory
* `OrderCreateSerializer`
* `OrderListSerializer`
* `OrderDetailSerializer`
* `OrderFulfillmentSerializer`

## Filters
* `state`
* `customer_id`

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
* **Business Validation (Rules):** Service Layer (`OrderService`)
Controllers remain thin.

## Permission Matrix

| Endpoint | Required Permission |
| -------- | ------------------- |
| `POST /api/v1/orders/` | `order.create` |
| `GET /api/v1/orders/` | `order.view_own` (Customer), `order.view` (Staff+) |
| `GET /api/v1/orders/{id}/` | `order.view_own` (Customer), `order.view` (Staff+) |
| `POST /api/v1/orders/{id}/cancel/` | `order.cancel` |
| `POST /api/v1/orders/{id}/fulfill/` | `order.fulfill` |

## Forbidden Endpoints
Explicitly prohibit:
* `PATCH /orders/{id}/mark-paid/`
* `PATCH /orders/{id}/force-fulfill/`
* Any endpoint bypassing Service Layer ownership.

## Dependencies
* docs/architecture/order/order-domain.md
* docs/architecture/order/order-services.md
* docs/architecture/order/order-permissions.md
* docs/implementation/order/order-service-design.md
* docs/implementation/order/order-permission-mapping.md

## Open Questions
UNRESOLVED — BUSINESS DECISION REQUIRED

## Completion Criteria
UNRESOLVED — BUSINESS DECISION REQUIRED
