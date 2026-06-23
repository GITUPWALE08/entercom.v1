# Test Inventory

Test ID: TEST-PROD-001

Category: MODEL

Business Rule: Category slug must be unique

Source Documents: product-model-design.md

Preconditions: N/A

Action: Save duplicate slug

Expected Result: IntegrityError raised

Negative Cases: Cannot save duplicate

Priority: HIGH

---

Test ID: TEST-PROD-002

Category: MODEL

Business Rule: Product archive restrictions

Source Documents: product-model-design.md

Preconditions: Product has active orders

Action: Archive product

Expected Result: Status updated to archived

Negative Cases: Active orders not affected

Priority: HIGH

---

Test ID: TEST-PROD-003

Category: MODEL

Business Rule: quantity_available >= 0

Source Documents: product-model-design.md

Preconditions: Product exists

Action: Set quantity_available to -1

Expected Result: Constraint failure

Negative Cases: Negative quantity rejected

Priority: HIGH

---

Test ID: TEST-PROD-004

Category: MODEL

Business Rule: low_stock_threshold >= 0

Source Documents: product-model-design.md

Preconditions: Product exists

Action: Set low_stock_threshold to -1

Expected Result: Constraint failure

Negative Cases: Negative threshold rejected

Priority: HIGH

---

Test ID: TEST-PROD-005

Category: MODEL

Business Rule: JSON attributes persistence

Source Documents: product-model-design.md

Preconditions: Product exists

Action: Save valid JSON attributes

Expected Result: JSON saved and retrievable

Negative Cases: Invalid JSON rejected

Priority: MEDIUM

---

Test ID: TEST-PROD-006

Category: MODEL

Business Rule: Maximum 4 images per product

Source Documents: product-model-design.md

Preconditions: Product has 4 images

Action: Add 5th image

Expected Result: ValidationError raised

Negative Cases: 5th image rejected

Priority: MEDIUM

---

Test ID: TEST-PROD-007

Category: SERVICE

Business Rule: Create product

Source Documents: product-service-design.md

Preconditions: Valid product data

Action: Call ProductService.create_product

Expected Result: Product created

Negative Cases: Invalid data raises error

Priority: HIGH

---

Test ID: TEST-PROD-008

Category: SERVICE

Business Rule: Update product

Source Documents: product-service-design.md

Preconditions: Product exists

Action: Call ProductService.update_product

Expected Result: Product updated

Negative Cases: Invalid data raises error

Priority: HIGH

---

Test ID: TEST-PROD-009

Category: SERVICE

Business Rule: Archive product

Source Documents: product-service-design.md

Preconditions: Product active

Action: Call ProductService.archive_product

Expected Result: Product archived

Negative Cases: Already archived raises error

Priority: HIGH

---

Test ID: TEST-PROD-010

Category: SERVICE

Business Rule: Create category

Source Documents: product-service-design.md

Preconditions: Valid category data

Action: Call CategoryService.create_category

Expected Result: Category created

Negative Cases: Duplicate slug raises error

Priority: MEDIUM

---

Test ID: TEST-PROD-011

Category: SERVICE

Business Rule: Update category

Source Documents: product-service-design.md

Preconditions: Category exists

Action: Call CategoryService.update_category

Expected Result: Category updated

Negative Cases: Invalid data raises error

Priority: MEDIUM

---

Test ID: TEST-PROD-012

Category: SERVICE

Business Rule: Archive category

Source Documents: product-service-design.md

Preconditions: Category active

Action: Call CategoryService.archive_category

Expected Result: Category archived

Negative Cases: Already archived raises error

Priority: MEDIUM

---

Test ID: TEST-PROD-013

Category: SERVICE

Business Rule: Inventory reduction

Source Documents: product-service-design.md

Preconditions: Stock = 10

Action: Call InventoryService.reduce_inventory(5)

Expected Result: Stock becomes 5

Negative Cases: Reduce by 15 raises error

Priority: CRITICAL

---

Test ID: TEST-PROD-014

Category: SERVICE

Business Rule: Inventory adjustment

Source Documents: product-service-design.md

Preconditions: Stock = 10

Action: Call InventoryService.adjust_inventory(20)

Expected Result: Stock becomes 20

Negative Cases: Adjust to negative raises error

Priority: HIGH

---

Test ID: TEST-PROD-015

Category: SERVICE

Business Rule: Low stock detection

Source Documents: product-service-design.md

Preconditions: Stock = 5, Threshold = 10

Action: Call InventoryService._emit_low_stock

Expected Result: Event emitted

Negative Cases: No event if stock > threshold

Priority: HIGH

---

Test ID: TEST-PROD-016

Category: PERMISSION

Business Rule: product.view allowed for Customer

Source Documents: product-permission-mapping.md

Preconditions: Customer user

Action: Access view action

Expected Result: Action allowed

Negative Cases: N/A

Priority: MEDIUM

---

Test ID: TEST-PROD-017

Category: PERMISSION

Business Rule: product.create allowed for Staff, denied for Customer

Source Documents: product-permission-mapping.md

Preconditions: Customer user

Action: Access create action

Expected Result: PermissionDenied raised

Negative Cases: Customer rejected

Priority: HIGH

---

Test ID: TEST-PROD-018

Category: PERMISSION

Business Rule: product.update allowed for Staff, denied for Customer

Source Documents: product-permission-mapping.md

Preconditions: Customer user

Action: Access update action

Expected Result: PermissionDenied raised

Negative Cases: Customer rejected

Priority: HIGH

---

Test ID: TEST-PROD-019

Category: PERMISSION

Business Rule: product.archive allowed for Manager, denied for Staff

Source Documents: product-permission-mapping.md

Preconditions: Staff user

Action: Access archive action

Expected Result: PermissionDenied raised

Negative Cases: Staff rejected

Priority: HIGH

---

Test ID: TEST-PROD-020

Category: PERMISSION

Business Rule: category.create allowed for Staff, denied for Customer

Source Documents: product-permission-mapping.md

Preconditions: Customer user

Action: Access category create

Expected Result: PermissionDenied raised

Negative Cases: Customer rejected

Priority: HIGH

---

Test ID: TEST-PROD-021

Category: PERMISSION

Business Rule: inventory.view allowed for Staff, denied for Customer

Source Documents: product-permission-mapping.md

Preconditions: Customer user

Action: Access inventory view

Expected Result: PermissionDenied raised

Negative Cases: Customer rejected

Priority: HIGH

---

Test ID: TEST-PROD-022

Category: PERMISSION

Business Rule: inventory.adjust allowed for Staff, denied for Customer

Source Documents: product-permission-mapping.md

Preconditions: Customer user

Action: Access inventory adjust

Expected Result: PermissionDenied raised

Negative Cases: Customer rejected

Priority: HIGH

---

Test ID: TEST-PROD-023

Category: API

Business Rule: GET /api/v1/products/

Source Documents: product-api-design.md

Preconditions: Products exist

Action: Call endpoint

Expected Result: 200 OK with list

Negative Cases: Invalid filters return 400

Priority: HIGH

---

Test ID: TEST-PROD-024

Category: API

Business Rule: POST /api/v1/products/

Source Documents: product-api-design.md

Preconditions: Staff user logged in

Action: Call endpoint with payload

Expected Result: 201 Created

Negative Cases: Invalid payload returns 400

Priority: HIGH

---

Test ID: TEST-PROD-025

Category: API

Business Rule: POST /api/v1/products/{id}/archive/

Source Documents: product-api-design.md

Preconditions: Manager user logged in

Action: Call endpoint

Expected Result: 200 OK

Negative Cases: Staff returns 403

Priority: HIGH

---

Test ID: TEST-PROD-026

Category: EVENT

Business Rule: product.created event emission

Source Documents: product-event-contracts.md

Preconditions: Product creation successful

Action: Check event bus

Expected Result: product.created emitted with payload

Negative Cases: No event on failure

Priority: HIGH

---

Test ID: TEST-PROD-027

Category: EVENT

Business Rule: inventory.adjusted event emission

Source Documents: product-event-contracts.md

Preconditions: Inventory adjustment successful

Action: Check event bus

Expected Result: inventory.adjusted emitted

Negative Cases: No event on failure

Priority: HIGH

---

Test ID: TEST-PROD-028

Category: EVENT

Business Rule: inventory.low_stock event emission

Source Documents: product-event-contracts.md

Preconditions: Stock falls below threshold

Action: Check event bus

Expected Result: inventory.low_stock emitted

Negative Cases: No event on failure

Priority: HIGH

---

Test ID: TEST-PROD-029

Category: AUDIT

Business Rule: product audit creation and metadata

Source Documents: product-audit-spec.md

Preconditions: Product created

Action: Check audit logs

Expected Result: Log exists with correct actor/metadata

Negative Cases: Log missing

Priority: HIGH

---

Test ID: TEST-PROD-030

Category: AUDIT

Business Rule: product audit immutability

Source Documents: product-audit-spec.md

Preconditions: Audit log exists

Action: Attempt to update log

Expected Result: Exception raised

Negative Cases: Update succeeds (failure case)

Priority: CRITICAL

---

Test ID: TEST-PROD-031

Category: BACKGROUND JOB

Business Rule: Inventory Low Stock Job execution

Source Documents: order-background-jobs.md

Preconditions: Multiple low stock products

Action: Run inventory_low_stock_job

Expected Result: Multiple events emitted safely

Negative Cases: Job crashes on partial failure

Priority: HIGH

---

Test ID: TEST-PROD-032

Category: INTEGRATION

Business Rule: Order -> Inventory reduction trigger

Source Documents: product-test-strategy.md

Preconditions: Order paid

Action: Process payment paid event

Expected Result: Inventory reduced

Negative Cases: Inventory not reduced

Priority: CRITICAL

---

