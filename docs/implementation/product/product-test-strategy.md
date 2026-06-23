# Product Test Strategy Design

## Purpose
To define the comprehensive, canonical testing requirements for the Product Domain in Phase 5. This strategy ensures strict compliance with all documented architectural and implementation rules.

## Scope
* Model Tests
* Service Tests
* Permission Tests
* API Tests
* Event Tests
* Audit Tests
* Background Job Tests
* Integration Tests

## Out of Scope
* Test code generation (pytest, mocks, factories)
* Inventing undocumented business rules
* Implementation details

## Model Test Requirements

| Component | Required Tests |
| --------- | -------------- |
| `ProductCategory` | Category slug uniqueness, Indexes, Constraints |
| `Product` | Product archive restrictions, `quantity_available >= 0`, `low_stock_threshold >= 0`, JSON attributes persistence, Indexes, Constraints |
| `ProductImage` | Maximum 4 images per product, Indexes, Constraints |

## Service Test Requirements

| Component | Required Tests |
| --------- | -------------- |
| `ProductService` | Create product, Update product, Archive product |
| `CategoryService` | Create category, Update category, Archive category |
| `InventoryService` | Inventory reduction, Inventory adjustment, Low stock detection |

## Permission Test Requirements

| Permission | Positive Test | Negative Test |
| ---------- | ------------- | ------------- |
| `product.view` | Customer/Staff/Manager/Superadmin can view | N/A (Publicly viewable rules apply) |
| `product.create` | Staff/Manager/Superadmin can create | Customer cannot create |
| `product.update` | Staff/Manager/Superadmin can update | Customer cannot update |
| `product.archive` | Manager/Superadmin can archive | Customer/Staff cannot archive |
| `category.view` | Customer/Staff/Manager/Superadmin can view | N/A |
| `category.create` | Staff/Manager/Superadmin can create | Customer cannot create |
| `category.update` | Staff/Manager/Superadmin can update | Customer cannot update |
| `category.archive` | Manager/Superadmin can archive | Customer/Staff cannot archive |
| `inventory.view` | Staff/Manager/Superadmin can view | Customer cannot view |
| `inventory.adjust` | Staff/Manager/Superadmin can adjust | Customer cannot adjust |
| `inventory.manage` | Manager/Superadmin can manage | Customer/Staff cannot manage |

*Note: IDOR protection tests apply where specific resource ownership exists. For Product Domain, standard role-based access is primarily tested.*

## API Test Requirements

| Component | Required Tests |
| --------- | -------------- |
| `GET /api/v1/product-categories/` | List, Filtering, Pagination, Validation |
| `GET /api/v1/products/` | List, Filtering, Pagination, Validation |
| `POST /api/v1/products/` | Create, Validation |
| `PATCH /api/v1/products/{id}/` | Update, Validation |
| `POST /api/v1/products/{id}/archive/` | Archive, Validation |
| `POST /api/v1/products/{id}/inventory-adjust/` | Adjust, Validation |

## Event Test Requirements
For every event (`product.*`, `category.*`, `inventory.*`), the following must be verified:
* Verify producer
* Verify payload schema
* Verify required fields
* Verify `correlation_id` propagation
* Verify version (always 1)
* Verify consumer compatibility

## Audit Test Requirements
For all product audit actions, the following must be verified:
* Verify audit creation
* Verify actor
* Verify metadata
* Verify `correlation_id`
* Verify immutability expectations

## Background Job Test Requirements

### Inventory Low Stock Job
| Component | Required Tests |
| --------- | -------------- |
| Execution | Threshold detection, Event emission, Audit emission, Idempotency |

## Integration Test Requirements

| Component | Required Tests |
| --------- | -------------- |
| Order → Inventory | Inventory reduction triggered by Order domain |

## Coverage Matrix

| Layer | Required Coverage |
| ----- | ----------------- |
| Models | 100% |
| Services | 100% |
| Permissions | 100% |
| APIs | 100% |
| Events | 100% |
| Audits | 100% |
| Background Jobs | 100% |
| Integrations | 100% |

## Dependencies
* docs/architecture/product/product-domain.md
* docs/implementation/product/product-model-design.md
* docs/implementation/product/product-service-design.md
* docs/implementation/product/product-permission-mapping.md
* docs/implementation/product/product-api-design.md
* docs/implementation/product/product-event-contracts.md
* docs/implementation/product/product-audit-spec.md

## Open Questions
UNRESOLVED — BUSINESS DECISION REQUIRED

## Completion Criteria
UNRESOLVED — BUSINESS DECISION REQUIRED
