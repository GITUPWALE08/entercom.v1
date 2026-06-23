# Payment Background Jobs Design

## Purpose
To define the asynchronous processing, scheduled execution rules, and transaction boundaries for background jobs within the Payment Domain in Phase 5.

## Scope
* Payment Expiry processing
* Webhook Reconciliation placeholder

## Out of Scope
* Celery implementation
* Cron configuration
* Django management commands
* Code generation

## Job Inventory

| Job | Owner | Status |
| --- | ----- | ------ |
| `Payment Expiry Job` | Payment Domain | Phase 5 Implementation |
| `Webhook Reconciliation Job` | Payment Domain | Future Placeholder |

## Ownership
The Payment Domain owns the execution of these background processes to manage internal aggregate consistency.

## Execution Rules

### Payment Expiry Job
| Rule | Description |
| ---- | ----------- |
| Trigger | Scheduled background execution |
| Schedule Frequency | UNRESOLVED — BUSINESS DECISION REQUIRED |

## Selection Criteria

### Payment Expiry Job
* Payments where `state = pending`
* AND `created_at` is older than 24 hours

## State Transition Rules
* `Payment Expiry Job` updates Payment: `pending` → `cancelled`

## Event Production

| Event | Producer |
| ----- | -------- |
| `payment.expired` | Payment Expiry Job |

## Audit Production

| Audit Action | Producer |
| ------------ | -------- |
| `payment.expired` | Payment Expiry Job |

## Transaction Boundaries
### Payment Expiry Job
* **Atomic Update Scope:** Transitioning the Payment status from `pending` to `cancelled` occurs strictly within an atomic database transaction.
* **Audit Scope:** The `payment.expired` audit record must be written within the same atomic lock.
* **Event Scope:** The `payment.expired` event must be safely queued `on_commit`.
* **Rollback Expectations:** Failure to update state or audit logs completely rolls back the transaction, leaving the record `pending`.
* **Partial Failure Expectations:** If batch processing is used, a single failure must not rollback the entire batch (transaction per record).

## Idempotency Rules
* **Preventing Duplicate Execution:** The job uses row-level locking or optimistic concurrency to ensure concurrent job runs do not process the same payment.
* **Preventing Duplicate Events/Audits:** Transitioning the state ensures that a payment already marked `cancelled` is excluded from the Selection Criteria, making it impossible to re-emit the audit or event. Running twice must not create duplicate transitions.

## Failure Handling
* **Retry Behavior:** UNRESOLVED — BUSINESS DECISION REQUIRED
* **Dead Letter Expectations:** UNRESOLVED — BUSINESS DECISION REQUIRED
* **Manual Recovery Expectations:** Operator intervention via Django Admin if state locks become permanently wedged.
* **Operator Visibility Requirements:** Logs must surface failures or deadlocks per job run.

## Future Placeholder Jobs

### Webhook Reconciliation Job
* **Purpose:** Future recovery mechanism for missed Paystack webhooks.
* **Status:** Future Placeholder.
* **Phase 5:** No implementation, No schedule, No execution, No API.
* **Future Ownership:** Payment Domain.
* **Future Consumers:** OrderService, Audit Framework.
* **Future Dependencies:** Paystack Verification APIs.

## Forbidden Job Behaviors
Explicitly prohibit:
* Inventory reduction
* Payment initialization
* Order creation
* Order fulfillment
* Webhook signature verification
* Notification delivery
* WebSocket broadcasting
* Frontend-triggered execution

## Dependencies
* docs/architecture/payment/payment-domain.md
* docs/implementation/payment/payment-service-design.md
* docs/implementation/payment/payment-event-contracts.md
* docs/implementation/payment/payment-audit-spec.md

## Open Questions
UNRESOLVED — BUSINESS DECISION REQUIRED

## Completion Criteria
UNRESOLVED — BUSINESS DECISION REQUIRED
