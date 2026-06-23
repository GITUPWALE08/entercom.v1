# Payment Test Strategy Design

## Purpose
To define the comprehensive, canonical testing requirements for the Payment Domain in Phase 5. This strategy ensures strict compliance with all documented architectural and implementation rules.

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
| `Payment` | One Order → One Payment, Unique paystack_reference, State validation, Expiration logic, Indexes, Constraints |

## Service Test Requirements

| Component | Required Tests |
| --------- | -------------- |
| `PaymentService` | Initialize payment, Cancel payment, State transitions |
| `WebhookService` | Webhook processing, Webhook rejection, State transitions |

## Permission Test Requirements

| Permission | Positive Test | Negative Test |
| ---------- | ------------- | ------------- |
| `payment.initialize` | Customer initializes own payment | Customer initializes another's payment |
| `payment.view_own` | Customer views own payment | Customer views another's payment (IDOR) |
| `payment.view` | Staff/Manager/Superadmin views payments | N/A |
| `payment.cancel` | Manager/Superadmin cancels | Customer cancels (unless explicitly permitted) |
| `payment.reconcile` | Manager/Superadmin reconciles | Customer/Staff reconciles |
| `webhook.process` | SYSTEM/WEBHOOK accesses endpoint | Any human role accesses endpoint |
| `webhook.view` | Staff/Manager/Superadmin views | Customer views |

## API Test Requirements

| Component | Required Tests |
| --------- | -------------- |
| `POST /api/v1/orders/{id}/initialize-payment/` | Initialize, Validation, Security |
| `GET /api/v1/payments/` | View List, Validation, Security |
| `POST /api/v1/payments/{id}/cancel/` | Cancel, Validation, Security |
| `POST /api/v1/payments/webhooks/paystack/` | Webhook endpoint, Validation, Security (HMAC) |

## Event Test Requirements
For every event (`payment.initialized`, `payment.paid`, `payment.failed`, `payment.cancelled`, `payment.expired`, `webhook.received`, `webhook.rejected`), the following must be verified:
* Verify producer
* Verify payload schema
* Verify required fields
* Verify `correlation_id` propagation
* Verify version (always 1)
* Verify consumer compatibility

## Audit Test Requirements
For all payment audit actions, the following must be verified:
* Verify audit creation
* Verify actor
* Verify metadata
* Verify `correlation_id`
* Verify immutability expectations

## Background Job Test Requirements

| Component | Required Tests |
| --------- | -------------- |
| Payment Expiry Job | Selection logic, State transition, Event emission, Audit emission, Idempotency |
| Webhook Reconciliation | Placeholder verification only. No execution tests. |

## Integration Test Requirements

| Component | Required Tests |
| --------- | -------------- |
| Paystack webhook flow | Network/payload integration isolation |
| Payment → Order | Hand-off validation |
| Payment → Inventory | Ensures boundary safety |
| Payment → Audit | Ensures persistence |
| Payment → Events | Ensures emission |
| Correlation chain | Verifies trace propagation (Order → Payment → Webhook → Inventory) |

## Webhook Idempotency Tests

### Purpose
Verify duplicate Paystack deliveries never produce duplicate state transitions.

### Required Tests

**Test: `webhook_duplicate_paid_event`**
* **Scenario:** webhook received, payment transitions pending → paid. Then identical webhook received again.
* **Verify:** payment remains paid, no second state transition, no second inventory reduction, no duplicate order fulfillment, no duplicate `payment.paid` event.

**Test: `webhook_duplicate_failed_event`**
* **Verify:** duplicate failures do not create duplicate events.

**Test: `webhook_duplicate_rejected_event`**
* **Verify:** duplicate rejected payloads remain safe.

## Payment Expiry Service Tests

### Purpose
Verify PaymentService expiration logic independently from Celery.

### Required Tests

**Test: `expire_payments_expires_pending_records`**
* **Verify:** pending payments older than threshold expire

**Test: `expire_payments_skips_paid_records`**
* **Verify:** paid payments never expire

**Test: `expire_payments_skips_cancelled_records`**
* **Verify:** cancelled payments never expire

**Test: `expire_payments_emits_event`**
* **Verify:** `payment.expired` produced.

**Test: `expire_payments_creates_audit`**
* **Verify:** `payment.expired` audit created.

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
* docs/architecture/payment/payment-domain.md
* docs/implementation/payment/payment-model-design.md
* docs/implementation/payment/payment-service-design.md
* docs/implementation/payment/payment-permission-mapping.md
* docs/implementation/payment/payment-api-design.md
* docs/implementation/payment/payment-event-contracts.md
* docs/implementation/payment/payment-audit-spec.md
* docs/implementation/payment/payment-background-jobs.md

## Open Questions
UNRESOLVED — BUSINESS DECISION REQUIRED

## Completion Criteria
UNRESOLVED — BUSINESS DECISION REQUIRED
