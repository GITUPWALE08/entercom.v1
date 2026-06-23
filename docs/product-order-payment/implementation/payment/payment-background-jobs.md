# Payment Background Jobs Design

## 1. Purpose
The purpose of this document is to define the strict implementation requirements for background processes within the Payment Domain. It establishes the rules for autonomous lifecycle enforcement (specifically 24-hour expiration) and defines the architectural boundaries for future webhook reconciliation workflows.

## 2. Scope
This document covers:
* The **Payment Expiry Job**.
* The **Webhook Reconciliation Job** (Future Placeholder).
* Architectural principles governing idempotency, transactional safety, and audit/event correlation.

## 3. Out of Scope
* Technical configurations for message brokers (Redis, RabbitMQ).
* Python/Celery code generation or cron definitions.
* Notification dispatch or WebSocket delivery (Phase 6).
* Inventory reduction or order state management outside of payment expiry.

## 4. Dependencies
* **Payment Domain Architecture**
* **Payment Service Implementation Design**
* **Payment Event Contracts**
* **Payment Audit Specification**

## 5. Background Job Principles
* **Idempotency:** Jobs must be safe to execute concurrently or repeatedly without causing duplicate state transitions, audits, or events.
* **Retry Safety:** Jobs must gracefully handle transient database or network failures without corrupting financial records.
* **Audit Requirements:** Every autonomous state mutation MUST produce an immutable audit record attributed to the `SYSTEM` actor.
* **Ownership:** Background jobs must invoke the authoritative domain service (e.g., `PaymentService`) rather than executing raw database queries.
* **Transaction Boundaries:** State updates, audit creation, and event emission must be strictly enclosed within a single database transaction (`@transaction.atomic`).

## 6. Job Inventory
The following jobs are authorized within the Payment Domain:
1.  **Payment Expiry Job**
2.  **Webhook Reconciliation Job** (Future Placeholder)

*Note: No additional jobs may be invented or implemented.*

## 7. Detailed Job Specifications

### 7.1 Payment Expiry Job
* **Purpose:** Autonomously expire unpaid payments 24 hours after creation.
* **Ownership:** Payment Domain.
* **Owner:** `PaymentService`.
* **Trigger:** Scheduled background execution (e.g., periodic sweep).
* **Execution Rules:**
    1. Query all `Payment` records where `status = pending` AND `created_at < (now - 24 hours)`.
    2. Transition the Payment `status` to `cancelled`.
    3. **Crucial Rule:** The parent Order remains in the `pending_payment` state. (Order cancellation is orchestrated by the Order Domain consuming this event, NOT mutated directly by this job).
* **Idempotency Requirements:**
    * Safe to execute repeatedly.
    * Queries must strictly exclude `paid`, `cancelled`, and `failed` records to prevent expiring already-settled transactions.
    * Use row-level locking (`select_for_update(skip_locked=True)`) to prevent concurrent sweeps from processing the same record.
* **Failure Handling:** If the transition fails, the transaction is rolled back. The job will naturally re-attempt the record on its next scheduled sweep.
* **Correlation Rules:** The audit and event records MUST retrieve and propagate the original `correlation_id` stored on the `Payment` record.
* **Events Produced:** `payment.expired`
* **Audit Actions:** `payment.expired` (Actor: `SYSTEM`)

### 7.2 Webhook Reconciliation Job
* **Status:** Future Placeholder
* **Purpose:** Recover from missing provider webhooks (e.g., if the provider fails to deliver the webhook but the customer was charged).
* **Scope:** No implementation in the Phase 5 MVP.
* **Explicit MVP Rule:** The MVP does not execute reconciliation. MVP webhook processing remains the sole authoritative trigger.
* **Future Ownership:** Payment Domain / `ProviderService`.
* **Future Responsibilities:** Periodically poll the provider API for pending references and sync state.
* **Future Audit Expectations:** `payment.reconciled`, `provider.polled`.
* **Future Events:** `payment.paid` (if settled).

## 8. Audit Matrix

| Job | Audit Action | Actor | Required Metadata |
| :--- | :--- | :--- | :--- |
| Payment Expiry Job | `payment.expired` | `SYSTEM` | `payment_id`, `provider_reference`, `previous_state`, `new_state` |
| Webhook Reconciliation Job | *Future Placeholder* | `SYSTEM` | *N/A* |

## 9. Event Matrix

| Job | Events Produced | Consumer |
| :--- | :--- | :--- |
| Payment Expiry Job | `payment.expired` | OrderService (Current), Audit System (Current) |
| Webhook Reconciliation Job | *Future Placeholder*| *N/A* |

## 10. Forbidden Job Behavior
Background jobs in the Payment Domain are explicitly prohibited from performing the following actions:
* **Inventory reduction:** Jobs MUST NOT directly or indirectly reduce inventory.
* **Payment completion:** Jobs MUST NOT transition a payment to `paid` (This is strictly reserved for Webhook processing).
* **Webhook simulation:** Jobs MUST NOT spoof or bypass HMAC signature verification routines.
* **Order fulfillment:** Jobs MUST NOT transition orders to `fulfilled`.
* **Notification delivery:** Jobs MUST NOT trigger emails or SMS.
* **WebSocket delivery:** Jobs MUST NOT broadcast to Channels.
* **Order state mutation:** Jobs MUST NOT directly update Order models.

## 11. Open Questions
No unresolved background-job specification questions remain.

## 12. Completion Criteria
* The 24-hour expiry logic is explicitly mapped to the `payment.expired` event and audit action.
* The limitation that Order states are not directly mutated by Payment jobs is codified.
* Idempotency and locking strategies provide sufficient detail to generate safe Celery tasks.
* The Webhook Reconciliation concept is securely bounded as a future-only placeholder.
