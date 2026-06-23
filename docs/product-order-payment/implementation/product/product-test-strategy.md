# Product Test Strategy

## 1. Purpose
The purpose of this document is to define the comprehensive testing strategy for the Product Domain. It ensures that all architectural invariants, metadata constraints, and inventory management rules are rigorously verified before deployment.

## 2. Scope
This document covers:
* Model Tests (Product, Category).
* Service Tests (ProductService, CategoryService, InventoryService).
* API Tests (Endpoints, Filters, Pagination).
* Permission Tests (RBAC, Administrative isolation).
* Event Tests (Payload contracts).
* Audit Tests (Metadata, Immutability).

## 3. Out of Scope
* Actual Python/pytest code generation.
* Notification testing (Phase 6).
* WebSocket real-time delivery testing (Phase 6).
* Payment or Order lifecycle testing (Covered in respective domains).

## 4. Dependencies
* **Product Model Design**
* **Product Service Implementation Design**
* **Product Permission Mapping**
* **Product API Design**
* **Product Event Contracts**
* **Product Audit Specification**

## 5. Coverage Goals

### 5.1 Required Coverage Matrix
| Area | Target Coverage | Required Assertions | Failure Conditions |
| :--- | :--- | :--- | :--- |
| **Models** | 100% Constraints | DB-level constraints enforced. | Invalid data saves successfully. |
| **Services** | 100% Public Methods | State mutation, Audit invocation, Event emission. | Side-effects occur without audit. |
| **Permissions** | 100% Roles | `PermissionDenied` raised for unauthorized actors. | Action succeeds for denied role. |
| **APIs** | 100% Endpoints | Status codes, Schema matches, IDOR protection. | 500 errors, exposed private data. |
| **Events** | 100% Contracts | Payload validation against `product-event-contracts.md`. | Missing/invalid fields in payload. |
| **Audits** | 100% Actions | Immutability, `correlation_id` tracking. | Missing correlation ID. |

## 6. Test Categories

### 6.1 Model Tests
* **Category Relationship:** Verify `Product` belongs to exactly one `ProductCategory`.
* **Media Limit:** Verify `Product` cannot be associated with > 4 images.
* **Archived Behavior:** Verify setting `status = archived` functions correctly and cascades appropriately from Category to Product.
* **JSON Attributes:** Verify `attributes` field accepts valid JSON.

### 6.2 Service Tests
#### `ProductService`
* **Create/Update Product:** Verify successful metadata storage, event emission (`product.created`/`product.updated`), and audit log creation.
* **Archive Product:** Verify status transition, event emission (`product.archived`), and audit log creation.
* **Media Enforcement:** Verify service rejects attempts to add a 5th image.

#### `CategoryService`
* **Create/Update Category:** Verify successful creation/update, event emission, and audit creation.
* **Archive Category:** Verify cascade to child products, event emission (`category.archived`), and audit creation.

#### `InventoryService`
* **Validate Stock:** Verify hard stock check against `quantity_available`.
* **Reduce Inventory:** Verify mathematical depletion, `inventory.reduced` event emission, and strict audit creation.
* **Adjust Inventory:** Verify manual adjustment, `inventory.adjusted` event, and audit creation.
* **Evaluate Low Stock:** Verify threshold breach triggers `inventory.low_stock`.

### 6.3 Permission Tests
* **Customer Denials:** Prove Customer role cannot manage products, categories, or inventory. Prove Customers cannot access `POST/PATCH` endpoints.
* **Staff Access:** Prove Staff can create/update but cannot archive or manage inventory thresholds.
* **Manager Access:** Prove Manager can archive and adjust inventory.
* **Superadmin Access:** Prove Superadmin has full access.

### 6.4 API Tests
* **Endpoints:** `GET /products/`, `GET /products/{id}/`, `POST /products/`, `PATCH /products/{id}/`, `GET /categories/`, `GET /categories/{id}/`, `POST /categories/`, `PATCH /categories/{id}/`.
* **Scenarios:**
    * Success cases for all valid operations.
    * Validation failures (400 Bad Request).
    * Authorization failures (401/403).
    * Not Found (404).
* **Filtering & Pagination:** Verify `category_id`, `is_active`, `is_archived` filters work correctly. Verify default and max page sizes.
* **Archived Visibility:** Prove archived products are returned in `GET` requests but include a flag indicating they are not purchasable.

### 6.5 Event Tests
* **Payload Validation:** Validate schema, version, required fields, and producer for:
    * `product.created`, `product.updated`, `product.archived`
    * `category.created`, `category.updated`, `category.archived`
    * `inventory.reduced`, `inventory.adjusted`, `inventory.low_stock`
* **Traceability:** Prove `correlation_id` is present in all envelopes.

### 6.6 Audit Tests
* **Action Names:** Verify exactly matching action names from `product-audit-spec.md`.
* **Metadata & Actor:** Verify actor ID/Role, required metadata fields (e.g., `quantity_before` / `quantity_after` for inventory).
* **Correlation:** Prove `inventory.reduced` correctly propagates the `correlation_id` from the parent payment action.

### 6.7 Concurrency Tests
* **Concurrent Inventory Reduction:** Prove concurrent attempts to reduce stock rely on database row locks (`select_for_update`) and do not result in negative stock.

## 7. Open Questions
No unresolved testing strategy questions remain.

## 8. Completion Criteria
* The document outlines enough detail for QA to implement full coverage tests.
* The strategy ensures that the "inventory is reduced only after payment.paid" rule can be provably tested.
* All test scenarios strictly map to approved architectural documents without assuming Phase 6 capabilities.
