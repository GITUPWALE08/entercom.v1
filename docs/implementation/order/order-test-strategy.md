# Order Test Strategy Design

## Purpose
To define the comprehensive, canonical testing requirements for the Order Domain in Phase 5. This strategy ensures strict compliance with all documented architectural and implementation rules.

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
| `Order` | One Request → One Order, Order totals, Indexes, Constraints |
| `OrderItem` | Snapshot price persistence, Positive quantity, Indexes, Constraints |

## Service Test Requirements

| Component | Required Tests |
| --------- | -------------- |
| `OrderService` | Create order, Cancel order, Fulfill order, Payment-required transition, Inventory reduction trigger |

## Permission Test Requirements

| Permission | Positive Test | Negative Test |
| ---------- | ------------- | ------------- |
| `order.create` | Customer creates own order | N/A |
| `order.view_own` | Customer views own order | Customer views another customer's order (IDOR) |
| `order.view` | Staff/Manager/Superadmin views orders | Customer views all orders |
| `order.cancel` | Customer/Manager/Superadmin cancels pending order | Customer cancels another's order; Anyone cancels paid order |
| `order.fulfill` | Staff/Manager/Superadmin fulfills order | Customer fulfills order |
| `order.override_fulfillment` | Manager/Superadmin overrides | Customer/Staff overrides |

## API Test Requirements

| Component | Required Tests |
| --------- | -------------- |
| `POST /api/v1/orders/` | Create, Validation |
| `GET /api/v1/orders/` | List, Filters, Validation |
| `GET /api/v1/orders/{id}/` | Retrieve, Validation |
| `POST /api/v1/orders/{id}/cancel/` | Cancel, Validation |
| `POST /api/v1/orders/{id}/fulfill/` | Fulfill, Validation |

## Event Test Requirements
For every event (`order.created`, `order.cancelled`, `order.fulfilled`), the following must be verified:
* Verify producer
* Verify payload schema
* Verify required fields
* Verify `correlation_id` propagation
* Verify version (always 1)
* Verify consumer compatibility

## Audit Test Requirements
For all order audit actions, the following must be verified:
* Verify audit creation
* Verify actor
* Verify metadata
* Verify `correlation_id`
* Verify immutability expectations

## Background Job Test Requirements

| Component | Required Tests |
| --------- | -------------- |
| Inventory Low Stock integration | Execution triggers correctly via external domain |

## Integration Test Requirements

| Component | Required Tests |
| --------- | -------------- |
| Order → Payment | Hand-off validation |
| Order → Inventory | Orchestration of reduction |
| Order → Audit | Ensures persistence |
| Order → Events | Ensures emission |
| Correlation chain | Verifies trace propagation (Order → Payment → Webhook → Inventory) |

## Archived Product Ordering Prevention Tests

### Purpose
Verify archived products can never enter the ordering workflow.

### Required Tests

**Test: `order_create_rejects_archived_product`**
* **Verify:** `Product.status == archived` AND `OrderService.create_order()` raises `ValidationError`

**Test: `order_api_rejects_archived_product`**
* **Verify:** archived product submitted via API returns validation failure

**Expected Outcome:**
Archived products remain visible. Archived products cannot be ordered.

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
* docs/architecture/order/order-domain.md
* docs/implementation/order/order-model-design.md
* docs/implementation/order/order-service-design.md
* docs/implementation/order/order-permission-mapping.md
* docs/implementation/order/order-api-design.md
* docs/implementation/order/order-event-contracts.md
* docs/implementation/order/order-audit-spec.md

## Open Questions
UNRESOLVED — BUSINESS DECISION REQUIRED

## Completion Criteria
UNRESOLVED — BUSINESS DECISION REQUIRED
