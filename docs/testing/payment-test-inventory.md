# Test Inventory

Test ID: TEST-PAY-001

Category: MODEL

Business Rule: Unique paystack_reference

Source Documents: payment-model-design.md

Preconditions: Payment with ref X

Action: Create second payment with ref X

Expected Result: IntegrityError

Negative Cases: Duplicate ref allowed

Priority: CRITICAL

---

Test ID: TEST-PAY-002

Category: MODEL

Business Rule: One order one payment

Source Documents: payment-model-design.md

Preconditions: Order has Payment

Action: Create second Payment for Order

Expected Result: IntegrityError

Negative Cases: Multiple payments for order

Priority: CRITICAL

---

Test ID: TEST-PAY-003

Category: MODEL

Business Rule: State validation constraints

Source Documents: payment-model-design.md

Preconditions: Payment PAID

Action: Set status to PENDING

Expected Result: Invalid transition error

Negative Cases: Transition allowed

Priority: HIGH

---

Test ID: TEST-PAY-004

Category: SERVICE

Business Rule: Initialize payment

Source Documents: payment-service-design.md

Preconditions: Valid order

Action: Call initialize

Expected Result: Payment created in PENDING

Negative Cases: Failure

Priority: CRITICAL

---

Test ID: TEST-PAY-005

Category: SERVICE

Business Rule: Cancel payment

Source Documents: payment-service-design.md

Preconditions: Payment PENDING

Action: Call cancel

Expected Result: Payment CANCELLED

Negative Cases: Payment PAID cancelled

Priority: HIGH

---

Test ID: TEST-PAY-006

Category: SERVICE

Business Rule: Expire payment

Source Documents: payment-test-strategy.md

Preconditions: Payment PENDING old

Action: Call expire_payments

Expected Result: Payment CANCELLED

Negative Cases: Payment PAID expired

Priority: HIGH

---

Test ID: TEST-PAY-007

Category: SERVICE

Business Rule: Payment state transitions

Source Documents: payment-service-design.md

Preconditions: Various states

Action: Transition

Expected Result: Valid paths pass, invalid fail

Negative Cases: Invalid paths pass

Priority: HIGH

---

Test ID: TEST-PAY-008

Category: WEBHOOK

Business Rule: Webhook processing

Source Documents: payment-service-design.md

Preconditions: Valid payload

Action: Process webhook

Expected Result: State updated

Negative Cases: Error

Priority: CRITICAL

---

Test ID: TEST-PAY-009

Category: WEBHOOK

Business Rule: Webhook rejection

Source Documents: payment-service-design.md

Preconditions: Invalid payload

Action: Process webhook

Expected Result: Rejected safely

Negative Cases: Crashes

Priority: HIGH

---

Test ID: TEST-PAY-010

Category: WEBHOOK

Business Rule: Valid signature verification

Source Documents: payment-api-design.md

Preconditions: Valid HMAC

Action: Hit webhook endpoint

Expected Result: 200 OK processed

Negative Cases: 403 Forbidden

Priority: CRITICAL

---

Test ID: TEST-PAY-011

Category: WEBHOOK

Business Rule: Invalid signature rejection

Source Documents: payment-api-design.md

Preconditions: Invalid HMAC

Action: Hit webhook endpoint

Expected Result: 403 Forbidden

Negative Cases: 200 OK

Priority: CRITICAL

---

Test ID: TEST-PAY-012

Category: WEBHOOK

Business Rule: Duplicate webhook safe handling

Source Documents: payment-test-strategy.md

Preconditions: Duplicate payload

Action: Hit webhook endpoint

Expected Result: 200 OK idempotently handled

Negative Cases: 500 Error

Priority: CRITICAL

---

Test ID: TEST-PAY-013

Category: WEBHOOK

Business Rule: webhook_duplicate_paid_event

Source Documents: payment-test-strategy.md

Preconditions: Duplicate PAID

Action: Process

Expected Result: No second transition/event

Negative Cases: Double credit

Priority: CRITICAL

---

Test ID: TEST-PAY-014

Category: WEBHOOK

Business Rule: webhook_duplicate_failed_event

Source Documents: payment-test-strategy.md

Preconditions: Duplicate FAILED

Action: Process

Expected Result: No second event

Negative Cases: Double event

Priority: HIGH

---

Test ID: TEST-PAY-015

Category: WEBHOOK

Business Rule: webhook_duplicate_rejected_event

Source Documents: payment-test-strategy.md

Preconditions: Duplicate rejection

Action: Process

Expected Result: Safe

Negative Cases: Crash

Priority: HIGH

---

Test ID: TEST-PAY-016

Category: API

Business Rule: POST /api/v1/orders/{id}/initialize-payment/

Source Documents: payment-api-design.md

Preconditions: Customer

Action: Call endpoint

Expected Result: 200 OK with link

Negative Cases: 400 Bad Request

Priority: HIGH

---

Test ID: TEST-PAY-017

Category: API

Business Rule: POST /api/v1/payments/{id}/cancel/

Source Documents: payment-api-design.md

Preconditions: Admin

Action: Call endpoint

Expected Result: 200 OK

Negative Cases: 403 Forbidden

Priority: HIGH

---

Test ID: TEST-PAY-018

Category: API

Business Rule: POST /api/v1/payments/webhooks/paystack/

Source Documents: payment-api-design.md

Preconditions: Paystack

Action: Call endpoint

Expected Result: 200 OK

Negative Cases: 500 Error

Priority: CRITICAL

---

Test ID: TEST-PAY-019

Category: API

Business Rule: GET /api/v1/payments/

Source Documents: payment-api-design.md

Preconditions: Staff

Action: Call endpoint

Expected Result: 200 OK list

Negative Cases: Customer sees all

Priority: HIGH

---

Test ID: TEST-PAY-020

Category: EVENT

Business Rule: payment.initialized event emission

Source Documents: payment-event-contracts.md

Preconditions: Initialized

Action: Check bus

Expected Result: Event emitted

Negative Cases: No event

Priority: HIGH

---

Test ID: TEST-PAY-021

Category: EVENT

Business Rule: payment.paid event emission

Source Documents: payment-event-contracts.md

Preconditions: Paid

Action: Check bus

Expected Result: Event emitted

Negative Cases: No event

Priority: CRITICAL

---

Test ID: TEST-PAY-022

Category: EVENT

Business Rule: payment.failed event emission

Source Documents: payment-event-contracts.md

Preconditions: Failed

Action: Check bus

Expected Result: Event emitted

Negative Cases: No event

Priority: HIGH

---

Test ID: TEST-PAY-023

Category: EVENT

Business Rule: payment.cancelled event emission

Source Documents: payment-event-contracts.md

Preconditions: Cancelled

Action: Check bus

Expected Result: Event emitted

Negative Cases: No event

Priority: HIGH

---

Test ID: TEST-PAY-024

Category: EVENT

Business Rule: payment.expired event emission

Source Documents: payment-event-contracts.md

Preconditions: Expired

Action: Check bus

Expected Result: Event emitted

Negative Cases: No event

Priority: HIGH

---

Test ID: TEST-PAY-025

Category: EVENT

Business Rule: webhook.received event emission

Source Documents: payment-event-contracts.md

Preconditions: Webhook hit

Action: Check bus

Expected Result: Event emitted

Negative Cases: No event

Priority: HIGH

---

Test ID: TEST-PAY-026

Category: EVENT

Business Rule: webhook.rejected event emission

Source Documents: payment-event-contracts.md

Preconditions: Invalid webhook hit

Action: Check bus

Expected Result: Event emitted

Negative Cases: No event

Priority: HIGH

---

Test ID: TEST-PAY-027

Category: AUDIT

Business Rule: payment audit actor

Source Documents: payment-audit-spec.md

Preconditions: Action taken

Action: Check audit

Expected Result: Actor correct (SYSTEM/User)

Negative Cases: Actor missing

Priority: HIGH

---

Test ID: TEST-PAY-028

Category: AUDIT

Business Rule: payment audit metadata

Source Documents: payment-audit-spec.md

Preconditions: Action taken

Action: Check audit

Expected Result: Metadata matches

Negative Cases: Metadata empty

Priority: HIGH

---

Test ID: TEST-PAY-029

Category: AUDIT

Business Rule: payment audit immutability

Source Documents: payment-audit-spec.md

Preconditions: Audit exists

Action: Update

Expected Result: Exception

Negative Cases: Update succeeds

Priority: CRITICAL

---

Test ID: TEST-PAY-030

Category: BACKGROUND JOB

Business Rule: Payment Expiry job selection logic

Source Documents: payment-background-jobs.md

Preconditions: Run job

Action: Verify selection

Expected Result: Selects only old pending

Negative Cases: Selects paid

Priority: HIGH

---

Test ID: TEST-PAY-031

Category: BACKGROUND JOB

Business Rule: Payment Expiry job state transition

Source Documents: payment-background-jobs.md

Preconditions: Job runs

Action: Verify status

Expected Result: Pending -> Cancelled

Negative Cases: Remains pending

Priority: HIGH

---

Test ID: TEST-PAY-032

Category: BACKGROUND JOB

Business Rule: Payment Expiry job event and audit emission

Source Documents: payment-background-jobs.md

Preconditions: Job runs

Action: Verify bus/db

Expected Result: Events and audits created

Negative Cases: Missing

Priority: HIGH

---

Test ID: TEST-PAY-033

Category: BACKGROUND JOB

Business Rule: Payment Expiry job retry handling

Source Documents: payment-background-jobs.md

Preconditions: Job fails mid-way

Action: Retry

Expected Result: Celery retries safely

Negative Cases: No retry

Priority: HIGH

---

Test ID: TEST-PAY-034

Category: BACKGROUND JOB

Business Rule: Payment Expiry job idempotency

Source Documents: payment-background-jobs.md

Preconditions: Job runs twice

Action: Verify

Expected Result: Second run no-op

Negative Cases: Second run errors

Priority: HIGH

---

Test ID: TEST-PAY-035

Category: INTEGRATION

Business Rule: Payment -> Order hand-off

Source Documents: payment-test-strategy.md

Preconditions: Payment paid

Action: Order notified

Expected Result: Order fulfills

Negative Cases: Order ignores

Priority: CRITICAL

---

Test ID: TEST-PAY-036

Category: INTEGRATION

Business Rule: Payment -> Audit persistence

Source Documents: payment-test-strategy.md

Preconditions: Payment action

Action: DB check

Expected Result: Audit saved

Negative Cases: Not saved

Priority: HIGH

---

Test ID: TEST-PAY-037

Category: INTEGRATION

Business Rule: Payment -> Event emission

Source Documents: payment-test-strategy.md

Preconditions: Payment action

Action: Bus check

Expected Result: Event sent

Negative Cases: Not sent

Priority: HIGH

---

Test ID: TEST-PAY-038

Category: INTEGRATION

Business Rule: Payment -> Inventory isolation boundary

Source Documents: payment-test-strategy.md

Preconditions: Payment paid

Action: Inventory notified via Order

Expected Result: Boundary holds

Negative Cases: Direct coupling

Priority: HIGH

---

Test ID: TEST-PAY-039

Category: INTEGRATION

Business Rule: Correlation chain strict propagation

Source Documents: payment-test-strategy.md

Preconditions: Order -> Payment

Action: Track ID

Expected Result: Same ID maintained

Negative Cases: ID lost

Priority: CRITICAL

---

Test ID: TEST-PAY-040

Category: INTEGRATION

Business Rule: Payment Webhook Idempotency full chain

Source Documents: payment-test-strategy.md

Preconditions: Duplicate Webhook

Action: Process

Expected Result: Idempotent across system

Negative Cases: Side effects multiply

Priority: CRITICAL

---

Test ID: TEST-PAY-041

Category: SERVICE

Business Rule: expire_payments_expires_pending_records

Source Documents: payment-test-strategy.md

Preconditions: Old pending

Action: Service call

Expected Result: Expired

Negative Cases: Not expired

Priority: HIGH

---

Test ID: TEST-PAY-042

Category: SERVICE

Business Rule: expire_payments_skips_paid_records

Source Documents: payment-test-strategy.md

Preconditions: Old paid

Action: Service call

Expected Result: Ignored

Negative Cases: Expired

Priority: HIGH

---

