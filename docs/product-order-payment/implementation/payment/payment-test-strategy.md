# Payment Test Strategy

## 1. Purpose
The purpose of this document is to define the comprehensive testing strategy for the Payment Domain. It ensures that all architectural invariants, webhook idempotency rules, retry mechanics, and financial immutability constraints are rigorously verified before deployment.

## 2. Scope
This document covers:
* Model Tests (Payment constraints, `paystack_reference` uniqueness).
* Service Tests (PaymentService, WebhookService).
* API Tests (Initialization, Retrieval, Webhook endpoints).
* Permission Tests (RBAC, Webhook system-only isolation).
* Event Tests (Payload contracts).
* Audit Tests (Financial immutability).
* Background Job Tests (24-hour expiry).
* Integration Tests (Webhook to Order updates).

## 3. Out of Scope
* Actual Python/pytest code generation.
* Notification testing (Phase 6).
* WebSocket real-time delivery testing (Phase 6).
* External calls to the real Paystack API (Mocked).

## 4. Dependencies
* **Payment Model Design**
* **Payment Service Implementation Design**
* **Payment Permission Mapping**
* **Payment API Design**
* **Payment Event Contracts**
* **Payment Audit Specification**
* **Payment Background Jobs Design**

## 5. Coverage Goals

### 5.1 Required Coverage Matrix
| Area | Target Coverage | Required Assertions | Failure Conditions |
| :--- | :--- | :--- | :--- |
| **Models** | 100% Constraints | 1 Order → 1 Payment mapping. | Duplicate payment created for order. |
| **Services** | 100% Public Methods | State mutation, Audit invocation, Event emission. | Webhook processing fails idempotency. |
| **Permissions** | 100% Roles | Webhook endpoint rejects human actors. | Manual `paid` transition succeeds. |
| **APIs** | 100% Endpoints | Signature validation, status codes. | Missing signature succeeds. |
| **Events** | 100% Contracts | Payload validation against `payment-event-contracts.md`. | Schema violations. |
| **Audits** | 100% Actions | Immutability, `correlation_id` tracking. | Missing correlation ID on webhooks. |
| **Jobs** | 100% Defined Jobs | Expiry logic, Idempotency. | Paid payment gets cancelled by job. |
| **Integration**| 100% Core Flows | Webhook received -> Order updated. | Boundaries crossed inappropriately. |
| **Concurrency**| High-Risk Paths | Duplicate webhook delivery rejected. | Duplicate events/audits emitted. |

## 6. Test Categories

### 6.1 Model Tests
* **One Order → One Payment:** Verify database constraint prevents creating multiple payments for a single order.
* **Paystack Reference Uniqueness:** Verify `paystack_reference` unique constraint.
* **State Transition Constraints:** Verify status field is strictly limited to allowed values (`pending`, `paid`, `failed`, `cancelled`).

### 6.2 Service Tests
#### `PaymentService`
* **Initialize Payment:** Verify creation of Payment, reference generation, event emission (`payment.initialized`), and audit creation.
* **Retry Payment:** Verify retrying a `failed` payment updates the SAME Payment record with a NEW `paystack_reference`.
* **Cancel Payment:** Verify manual cancellation sets status to `cancelled` and emits corresponding events/audits.

#### `WebhookService`
* **Process Webhook (Success):** Verify signature validation, idempotency check, transition to `paid`, event emission (`payment.paid`, `webhook.received`), and audit creation.
* **Process Webhook (Failed):** Verify transition to `failed` and appropriate event/audit creation.
* **Process Webhook (Invalid):** Verify signature failure rejects processing, emits `webhook.rejected`, and does NOT emit `payment.paid`.

### 6.3 Permission Tests
* **Customer Denials:** Prove Customer cannot access reconciliation endpoints or the webhook processor. Prove IDOR protection on initialization and viewing.
* **Webhook Isolation:** Prove that NO human role (Customer, Staff, Manager, Superadmin) can invoke `WebhookService.process_webhook()`. It must strictly require the `SYSTEM` actor context.

### 6.4 API Tests
* **Endpoints:** `POST /payments/{order_id}/initialize/`, `GET /payments/{id}/`, `POST /payments/{id}/retry/`, `POST /payments/webhooks/provider/`.
* **Scenarios:**
    * Success cases for all valid operations.
    * Validation failures.
    * Authorization failures.
* **Webhook Security:** Verify `POST /payments/webhooks/provider/` returns 401 Unauthorized if the HMAC signature is missing or invalid.
* **IDOR Prevention:** Verify Customer A receives 404/403 when requesting Customer B's payment.

### 6.5 Event Tests
* **Payload Validation:** Validate schema, version, required fields, and producer for:
    * `payment.initialized`, `payment.paid`, `payment.failed`, `payment.cancelled`, `payment.expired`.
    * `webhook.received`, `webhook.rejected`.
* **Contract Verification:** Prove `payment.paid` includes `previous_state` and `new_state`.

### 6.6 Audit Tests
* **Action Names:** Verify exactly matching action names from `payment-audit-spec.md`.
* **Metadata & Actor:** Verify actor ID/Role (`SYSTEM` for webhooks), required metadata fields (e.g., `signature_verified` boolean).
* **Correlation:** Prove `payment.paid` correctly propagates the `correlation_id` from the existing Payment record.

### 6.7 Background Job Tests
* **Payment Expiry Job:**
    * Verify 24-hour threshold detection (expires payments > 24h old, ignores newer).
    * Verify Idempotency (does not process already `paid`, `failed`, or `cancelled` payments).
    * Verify `payment.expired` audit and event generation.
    * Verify safe retries (transaction rollback on failure).
* **Webhook Reconciliation Job:**
    * Explicitly document: Future Placeholder. No MVP implementation. No MVP tests.

### 6.8 Integration Tests
* **Webhook to Order Integration:** Prove that a valid `payment.paid` event emitted by `WebhookService` successfully triggers an update to the related Order's state (handled by OrderService).
* **Correlation Chain:** Verify the `correlation_id` is identical across `payment.initialized` -> `webhook.received` -> `payment.paid`.

### 6.9 Concurrency Tests
* **Duplicate Webhook Delivery:** Prove that two concurrent webhook payloads for the same `paystack_reference` result in one successful processing and one idempotent exit (200 OK, no duplicate events/audits).
* **Concurrent Payment Processing:** Verify transaction safety and row-level locking during state transitions.

## 7. Forbidden Test Assumptions
* Do not require tests for Notifications or WebSocket delivery.
* Do not require tests executing external HTTP calls to the real Paystack API (must use mocks).
* Do not require tests for the future reconciliation execution.

## 8. Open Questions
No unresolved testing strategy questions remain.

## 9. Completion Criteria
* The document outlines enough detail for QA to implement full coverage tests.
* The rule that `payment.paid` can ONLY be reached via verified webhook is provably tested across Service, API, and Permission layers.
* Concurrency testing for duplicate webhook delivery is explicitly mandated.
