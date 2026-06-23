# Order Background Jobs Design

## Purpose
To define the asynchronous processing, scheduled execution rules, and transaction boundaries for background jobs within the Order Domain in Phase 5.

## Scope
* Inventory Low Stock Job

## Out of Scope
* Celery implementation
* Cron configuration
* Django management commands
* Code generation

## Job Inventory

| Job | Owner | Status |
| --- | ----- | ------ |
| `Inventory Low Stock Job` | Order Domain | Phase 5 Implementation |

## Ownership
The Order Domain owns the orchestration of this background process to evaluate cross-domain inventory limits.

## Execution Rules

### Inventory Low Stock Job
| Rule | Description |
| ---- | ----------- |
| Trigger | Scheduled background execution |
| Schedule Frequency | UNRESOLVED — BUSINESS DECISION REQUIRED |

## Selection Criteria

### Inventory Low Stock Job
* Products where `quantity_available <= low_stock_threshold`

## State Transition Rules
* No explicit state transition (Detection and Event-Emission only).

## Event Production

| Event | Producer |
| ----- | -------- |
| `inventory.low_stock` | Inventory Low Stock Job |

*Note: Phase 5 has NO notification delivery. Phase 5 ONLY produces the event + audit. Future Notification Service (Phase 6) will consume this event.*

## Audit Production

| Audit Action | Producer |
| ------------ | -------- |
| `inventory.low_stock` | Inventory Low Stock Job |

## Transaction Boundaries
### Inventory Low Stock Job
* **Atomic Update Scope:** Since no state is mutated on the Product, the atomic scope is strictly tied to the generation of the audit log and the queueing of the event `on_commit`.
* **Audit Scope:** Written within the atomic lock to guarantee audit persistence.
* **Event Scope:** Safely queued `on_commit`.
* **Rollback Expectations:** If the audit log fails to save, the event must not fire.
* **Partial Failure Expectations:** A failure on one product evaluation must not halt the processing of other products.

## Idempotency Rules
* **Preventing Duplicate Execution:** UNRESOLVED — BUSINESS DECISION REQUIRED (Must define a tracking mechanism, e.g., a "last_alerted_at" timestamp on the product, to prevent spamming the system every minute).
* **Preventing Duplicate Events/Audits:** Duplicate detection must be explicitly implemented to ensure the event is only emitted once per threshold crossing.
* **Exact Strategy:** UNRESOLVED — BUSINESS DECISION REQUIRED.

## Failure Handling
* **Retry Behavior:** UNRESOLVED — BUSINESS DECISION REQUIRED
* **Dead Letter Expectations:** UNRESOLVED — BUSINESS DECISION REQUIRED
* **Manual Recovery Expectations:** UNRESOLVED — BUSINESS DECISION REQUIRED
* **Operator Visibility Requirements:** Logs must clearly indicate which products failed the threshold check evaluation.

## Future Placeholder Jobs
None explicitly defined for the Order Domain in this phase.

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
* docs/architecture/order/order-domain.md
* docs/implementation/order/order-service-design.md
* docs/implementation/product/product-event-contracts.md
* docs/implementation/product/product-audit-spec.md

## Open Questions
UNRESOLVED — BUSINESS DECISION REQUIRED

## Completion Criteria
UNRESOLVED — BUSINESS DECISION REQUIRED
