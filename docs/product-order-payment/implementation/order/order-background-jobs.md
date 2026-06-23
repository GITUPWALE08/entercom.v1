# Order Background Jobs Design

## 1. Purpose
The purpose of this document is to define the strict implementation requirements for background processes within the Order Domain. It establishes the rules for autonomous inventory monitoring and event generation, ensuring that low stock conditions are accurately detected and reported without violating architectural boundaries.

## 2. Scope
This document covers:
* The **Inventory Low Stock Job**.
* Architectural principles governing idempotency, transactional safety, and event correlation.

## 3. Out of Scope
* Technical configurations for message brokers.
* Python/Celery code generation or cron definitions.
* Notification dispatch or WebSocket delivery (Phase 6).
* Inventory reduction math (handled by `InventoryService` during transactions, not jobs).
* Payment state tracking.

## 4. Dependencies
* **Order Domain Architecture**
* **Product Service Implementation Design**
* **Product Event Contracts**
* **Product Audit Specification**

## 5. Background Job Principles
* **Idempotency:** Jobs must be safe to execute concurrently or repeatedly without producing redundant alerts or spamming the event bus.
* **Retry Safety:** Jobs must gracefully handle transient failures.
* **Audit Requirements:** Every threshold breach emission MUST produce an immutable audit record attributed to the `SYSTEM` actor.
* **Ownership:** Background jobs must invoke the authoritative domain service (`InventoryService`) rather than executing raw database manipulations.
* **Transaction Boundaries:** Audit creation and event emission must be strictly enclosed within a single database transaction.

## 6. Job Inventory
The following job is authorized within the Order Domain:
1.  **Inventory Low Stock Job**

*Note: No additional jobs may be invented or implemented.*

## 7. Detailed Job Specifications

### 7.1 Inventory Low Stock Job
* **Purpose:** Detect low inventory conditions and signal for administrative replenishment.
* **Ownership:** Order Domain.
* **Owner:** `InventoryService`.
* **Trigger:** Scheduled background execution (e.g., periodic sweep).
* **Execution Rules:**
    1. Query all `Product` records where `quantity_available <= low_stock_threshold` and `status = 'active'`.
    2. Check the idempotency marker (e.g., `last_low_stock_alert_sent`) to prevent duplicate emissions for the same threshold breach.
* **Idempotency Requirements:**
    * Safe to execute repeatedly.
    * The system MUST prevent duplicate `inventory.low_stock` emissions if the quantity hasn't changed since the last alert, or if the alert was already sent within a configured timeframe.
* **Failure Handling:** If audit creation or event emission fails, the transaction is rolled back. The job re-attempts on the next cycle.
* **Events Produced:** `inventory.low_stock`
* **Audit Actions:** `inventory.low_stock` (Actor: `SYSTEM`)
* **Consumers:** The **Future Notification Service** (Phase 6).
    * *Explicit Rule:* Phase 5 has NO notification delivery. Phase 5 ONLY produces the event + audit.

## 8. Audit Matrix

| Job | Audit Action | Actor | Required Metadata |
| :--- | :--- | :--- | :--- |
| Inventory Low Stock Job | `inventory.low_stock` | `SYSTEM` | `product_id`, `current_quantity`, `threshold` |

## 9. Event Matrix

| Job | Events Produced | Consumer |
| :--- | :--- | :--- |
| Inventory Low Stock Job | `inventory.low_stock` | Audit System (Current), Notification Service (Future) |

## 10. Forbidden Job Behavior
Background jobs in the Order Domain are explicitly prohibited from performing the following actions:
* **Inventory reduction:** Jobs MUST NOT reduce inventory (this is strictly reserved for payment success events).
* **Payment completion:** Jobs MUST NOT interact with payment states.
* **Webhook simulation:** Jobs MUST NOT spoof payment events.
* **Order fulfillment:** Jobs MUST NOT automatically transition orders to `fulfilled`.
* **Notification delivery:** Jobs MUST NOT trigger emails or SMS directly.
* **WebSocket delivery:** Jobs MUST NOT broadcast to Channels.
* **Order state mutation:** Jobs MUST NOT mutate order state unrelated to inventory monitoring.

## 11. Open Questions
No unresolved background-job specification questions remain.

## 12. Completion Criteria
* The Low Stock Job is explicitly mapped to the `inventory.low_stock` event and audit action.
* The limitation that Phase 5 does not deliver notifications is codified.
* Idempotency requirements explicitly demand protection against duplicate alerts.
