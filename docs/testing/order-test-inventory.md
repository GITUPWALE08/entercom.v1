# Test Inventory

Test ID: TEST-ORD-001

Category: MODEL

Business Rule: One Request -> One Order

Source Documents: order-model-design.md

Preconditions: Order created with request_id

Action: Create second order with same request_id

Expected Result: IntegrityError raised

Negative Cases: Duplicate creation

Priority: CRITICAL

---

Test ID: TEST-ORD-002

Category: MODEL

Business Rule: Order totals calculation

Source Documents: order-model-design.md

Preconditions: Order with items

Action: Calculate total

Expected Result: Total equals sum of items

Negative Cases: Incorrect total

Priority: CRITICAL

---

Test ID: TEST-ORD-003

Category: MODEL

Business Rule: OrderItem snapshot price persistence

Source Documents: order-model-design.md

Preconditions: Item created with price 10

Action: Change product price to 20

Expected Result: Item price remains 10

Negative Cases: Item price changes to 20

Priority: CRITICAL

---

Test ID: TEST-ORD-004

Category: MODEL

Business Rule: OrderItem positive quantity constraint

Source Documents: order-model-design.md

Preconditions: Create OrderItem

Action: Set quantity to 0

Expected Result: Constraint failure

Negative Cases: Quantity 0 accepted

Priority: HIGH

---

Test ID: TEST-ORD-005

Category: SERVICE

Business Rule: Create order

Source Documents: order-service-design.md

Preconditions: Valid order data

Action: Call OrderService.create_order

Expected Result: Order created in PENDING

Negative Cases: Invalid data raises error

Priority: CRITICAL

---

Test ID: TEST-ORD-006

Category: SERVICE

Business Rule: Cancel order

Source Documents: order-service-design.md

Preconditions: Order is PENDING

Action: Call OrderService.cancel_order

Expected Result: Order is CANCELLED

Negative Cases: Order is PAID raises error

Priority: HIGH

---

Test ID: TEST-ORD-007

Category: SERVICE

Business Rule: Fulfill order

Source Documents: order-service-design.md

Preconditions: Order is PAID

Action: Call OrderService.fulfill_order

Expected Result: Order is FULFILLED

Negative Cases: Order is PENDING raises error

Priority: HIGH

---

Test ID: TEST-ORD-008

Category: SERVICE

Business Rule: Payment-required transition

Source Documents: order-service-design.md

Preconditions: Order is PENDING

Action: Call OrderService.require_payment

Expected Result: Order ready for payment

Negative Cases: Invalid transition

Priority: HIGH

---

Test ID: TEST-ORD-009

Category: SERVICE

Business Rule: Inventory reduction trigger

Source Documents: order-service-design.md

Preconditions: Payment is PAID

Action: Order processes payment event

Expected Result: Order triggers inventory reduction

Negative Cases: Inventory untouched

Priority: CRITICAL

---

Test ID: TEST-ORD-010

Category: SERVICE

Business Rule: Archived product rejection

Source Documents: order-test-strategy.md

Preconditions: Product is archived

Action: Call OrderService.create_order

Expected Result: ValidationError raised

Negative Cases: Order created with archived product

Priority: CRITICAL

---

Test ID: TEST-ORD-011

Category: PERMISSION

Business Rule: order.create allowed for Customer

Source Documents: order-permission-mapping.md

Preconditions: Customer user

Action: Access create order

Expected Result: Allowed

Negative Cases: N/A

Priority: HIGH

---

Test ID: TEST-ORD-012

Category: PERMISSION

Business Rule: order.view_own IDOR protection

Source Documents: order-permission-mapping.md

Preconditions: Customer user A

Action: Access Order belonging to B

Expected Result: PermissionDenied raised

Negative Cases: Access granted (IDOR)

Priority: CRITICAL

---

Test ID: TEST-ORD-013

Category: PERMISSION

Business Rule: order.view allowed for Staff, denied for Customer

Source Documents: order-permission-mapping.md

Preconditions: Customer user

Action: List all orders

Expected Result: PermissionDenied raised

Negative Cases: Customer sees all orders

Priority: HIGH

---

Test ID: TEST-ORD-014

Category: PERMISSION

Business Rule: order.cancel allowed for pending, denied for paid

Source Documents: order-permission-mapping.md

Preconditions: Customer user

Action: Cancel PAID order

Expected Result: PermissionDenied raised

Negative Cases: Cancellation succeeds

Priority: HIGH

---

Test ID: TEST-ORD-015

Category: PERMISSION

Business Rule: order.fulfill allowed for Staff, denied for Customer

Source Documents: order-permission-mapping.md

Preconditions: Customer user

Action: Fulfill order

Expected Result: PermissionDenied raised

Negative Cases: Fulfillment succeeds

Priority: HIGH

---

Test ID: TEST-ORD-016

Category: PERMISSION

Business Rule: order.override_fulfillment Manager only

Source Documents: order-permission-mapping.md

Preconditions: Staff user

Action: Override fulfillment

Expected Result: PermissionDenied raised

Negative Cases: Override succeeds

Priority: HIGH

---

Test ID: TEST-ORD-017

Category: API

Business Rule: POST /api/v1/orders/ validation

Source Documents: order-api-design.md

Preconditions: Customer logged in

Action: Submit invalid payload

Expected Result: 400 Bad Request

Negative Cases: 201 Created

Priority: HIGH

---

Test ID: TEST-ORD-018

Category: API

Business Rule: GET /api/v1/orders/ listing

Source Documents: order-api-design.md

Preconditions: Orders exist

Action: Call endpoint

Expected Result: 200 OK with orders

Negative Cases: Fails

Priority: HIGH

---

Test ID: TEST-ORD-019

Category: API

Business Rule: GET /api/v1/orders/{id}/ retrieve

Source Documents: order-api-design.md

Preconditions: Order exists

Action: Call endpoint

Expected Result: 200 OK

Negative Cases: 404 Not Found

Priority: HIGH

---

Test ID: TEST-ORD-020

Category: API

Business Rule: POST /api/v1/orders/{id}/cancel/

Source Documents: order-api-design.md

Preconditions: Order PENDING

Action: Call cancel

Expected Result: 200 OK

Negative Cases: 400 on invalid state

Priority: HIGH

---

Test ID: TEST-ORD-021

Category: API

Business Rule: POST /api/v1/orders/{id}/fulfill/

Source Documents: order-api-design.md

Preconditions: Order PAID

Action: Call fulfill

Expected Result: 200 OK

Negative Cases: 403 for Customer

Priority: HIGH

---

Test ID: TEST-ORD-022

Category: EVENT

Business Rule: order.created event emission

Source Documents: order-event-contracts.md

Preconditions: Order created

Action: Check bus

Expected Result: order.created emitted

Negative Cases: No event

Priority: HIGH

---

Test ID: TEST-ORD-023

Category: EVENT

Business Rule: order.cancelled event emission

Source Documents: order-event-contracts.md

Preconditions: Order cancelled

Action: Check bus

Expected Result: order.cancelled emitted

Negative Cases: No event

Priority: HIGH

---

Test ID: TEST-ORD-024

Category: EVENT

Business Rule: order.fulfilled event emission

Source Documents: order-event-contracts.md

Preconditions: Order fulfilled

Action: Check bus

Expected Result: order.fulfilled emitted

Negative Cases: No event

Priority: HIGH

---

Test ID: TEST-ORD-025

Category: AUDIT

Business Rule: order audit creation

Source Documents: order-audit-spec.md

Preconditions: Order created

Action: Check audits

Expected Result: Audit log created

Negative Cases: No audit log

Priority: HIGH

---

Test ID: TEST-ORD-026

Category: AUDIT

Business Rule: order audit metadata

Source Documents: order-audit-spec.md

Preconditions: Audit log exists

Action: Verify metadata

Expected Result: Metadata matches action

Negative Cases: Metadata corrupted

Priority: HIGH

---

Test ID: TEST-ORD-027

Category: AUDIT

Business Rule: order audit immutability

Source Documents: order-audit-spec.md

Preconditions: Audit log exists

Action: Update audit

Expected Result: Exception raised

Negative Cases: Update succeeds

Priority: CRITICAL

---

Test ID: TEST-ORD-028

Category: BACKGROUND JOB

Business Rule: Inventory Low Stock integration

Source Documents: order-background-jobs.md

Preconditions: Job runs

Action: Verify execution

Expected Result: External domain triggered safely

Negative Cases: Job crashes

Priority: HIGH

---

Test ID: TEST-ORD-029

Category: INTEGRATION

Business Rule: Order -> Payment hand-off

Source Documents: order-test-strategy.md

Preconditions: Order requires payment

Action: Initialize payment

Expected Result: Payment linked to Order safely

Negative Cases: Link fails

Priority: CRITICAL

---

Test ID: TEST-ORD-030

Category: INTEGRATION

Business Rule: Order -> Inventory reduction

Source Documents: order-test-strategy.md

Preconditions: Payment confirmed

Action: Order processes payment

Expected Result: Inventory reduced exactly once

Negative Cases: Inventory reduced multiple times

Priority: CRITICAL

---

Test ID: TEST-ORD-031

Category: INTEGRATION

Business Rule: Order -> Audit persistence

Source Documents: order-test-strategy.md

Preconditions: Order action

Action: Check DB

Expected Result: Audit transactionally persisted

Negative Cases: Audit lost

Priority: HIGH

---

Test ID: TEST-ORD-032

Category: INTEGRATION

Business Rule: Order -> Events emission

Source Documents: order-test-strategy.md

Preconditions: Order action

Action: Check bus

Expected Result: Event reliably emitted

Negative Cases: Event lost

Priority: HIGH

---

Test ID: TEST-ORD-033

Category: INTEGRATION

Business Rule: Correlation chain propagation

Source Documents: order-test-strategy.md

Preconditions: Order created

Action: Track ID

Expected Result: Same ID in Order, Payment, Inventory

Negative Cases: ID changes midway

Priority: CRITICAL

---

Test ID: TEST-ORD-034

Category: INTEGRATION

Business Rule: order_create_rejects_archived_product

Source Documents: order-test-strategy.md

Preconditions: Product archived

Action: Create order

Expected Result: ValidationError

Negative Cases: Order created

Priority: CRITICAL

---

Test ID: TEST-ORD-035

Category: INTEGRATION

Business Rule: order_api_rejects_archived_product

Source Documents: order-test-strategy.md

Preconditions: Product archived

Action: API create order

Expected Result: 400 Bad Request

Negative Cases: 201 Created

Priority: CRITICAL

---

Test ID: TEST-ORD-036

Category: INTEGRATION

Business Rule: IDOR API validation on retrieve

Source Documents: order-test-strategy.md

Preconditions: Customer A

Action: API GET Customer B order

Expected Result: 403/404 response

Negative Cases: 200 response with data

Priority: CRITICAL

---

