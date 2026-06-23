# Payment Auditing Architecture

## 1. Purpose
The purpose of this document is to define the mandatory audit and compliance requirements for the Payment domain within the Entercom platform. It establishes the forensic standards for tracking financial state transitions, webhook interactions, and inventory mutations, ensuring that financial actions are isolated, immutable, and permanently auditable.

## 2. Scope
This document covers:
* Audit event definitions for the payment lifecycle.
* Webhook processing audit requirements (received, rejected).
* Correlated auditing of inventory reduction triggered by payments.
* Data integrity, correlation, and permanent retention principles for financial logs.

## 3. Out of Scope
* Notification delivery logs (Phase 6).
* Real-time WebSocket event tracing (Phase 6).
* Analytics and reporting.
* Refund workflows and chargebacks.

## 4. Definitions
* **Financial Traceability:** The ability to reconstruct the complete history of a transaction from initialization to settlement.
* **Correlation ID:** A unique system-wide identifier linking a single customer intent across multiple boundaries.
* **Canonical Truth:** The strict principle that frontend activity is not authoritative.

## 5. Audit Principles
1. **Financial Isolation:** Financial actions are isolated from standard CRUD logs due to their high-risk nature.
2. **Absolute Accountability:** Every payment state transition MUST be audited.
3. **Immutability:** Financial actions are immutable. Audit records may never be modified or deleted.
4. **Append-Only:** Audit records are append-only. They never modify historical entries.
5. **Always Auditable:** Financial actions and webhook interactions are always auditable, regardless of success or failure.

## 6. Audit Inventory
The system MUST capture immutable audit records for the following actions:

### Payment Actions
* `payment.initialized`
* `payment.paid`
* `payment.failed`
* `payment.cancelled`

### Webhook Actions
* `webhook.received`
* `webhook.rejected`

### Inventory Actions
* `inventory.reduced`

## 7. Audit Specifications & Required Fields

### 7.1 Base Financial Fields
Every payment and inventory audit record MUST include:
* `audit_id`
* `timestamp`
* `correlation_id`
* `payment_id`
* `order_id`
* `request_id`
* `provider_reference`
* `actor_id`
* `actor_role`
* `action`

### 7.2 `payment.initialized`
* **Purpose:** Records the formal initiation of a financial commitment.
* **Trigger:** Payment creation.
* **Producer:** `PaymentService`
* **Required Fields:** Base Fields + `amount`, `currency`.

### 7.3 `payment.paid`
* **Purpose:** Records the definitive settlement of a transaction.
* **Trigger:** Successful verified Payment Provider webhook.
* **Producer:** `WebhookService`
* **Required Fields:** Base Fields + `amount`, `currency`, `previous_state`, `new_state`.

### 7.4 `payment.failed`
* **Purpose:** Records a confirmed decline from the payment provider.
* **Trigger:** Verified payment failure webhook.
* **Producer:** `WebhookService`
* **Required Fields:** Base Fields + `previous_state`, `new_state`.

### 7.5 `payment.cancelled`
* **Purpose:** Records the termination of a payment attempt without settlement.
* **Trigger:** Payment expiration (24h) or administrative cancellation.
* **Producer:** `PaymentService`
* **Required Fields:** Base Fields + `previous_state`, `new_state`.

### 7.6 `webhook.received`
* **Purpose:** Records the arrival of data from the provider for forensic history.
* **Trigger:** Webhook arrives at the platform.
* **Producer:** `WebhookService`
* **Required Fields:** 
  * `audit_id`, `timestamp`, `correlation_id`, `provider_reference`, `action`
  * `provider` (e.g., Payment Provider)
  * `webhook_event`
  * *(Secrets and raw signatures MUST NOT be stored).*

### 7.7 `webhook.rejected`
* **Purpose:** Records unauthorized, invalid, or duplicate provider communication attempts.
* **Trigger:** Invalid signature, invalid payload, failed verification. (Invalid/rejected webhooks result in payment.failed).
* **Producer:** `WebhookService`
* **Required Fields:**
  * `audit_id`, `timestamp`, `correlation_id`, `provider_reference`, `action`
  * `provider`
  * `rejection_reason`
  * `signature_verified` (Boolean)

### 7.8 `inventory.reduced`
* **Purpose:** Traceably links stock depletion to a specific financial settlement.
* **Trigger:** Successful payment causes stock deduction.
* **Producer:** `InventoryService`
* **Required Fields:** Base Fields + `product_id`, `quantity_before`, `quantity_after`, `quantity_reduced`.

## 8. Correlation Requirements
Every payment operation must propagate the `correlation_id`.
Correlation IDs must remain consistent across:
* Payment initialization
* Webhook receipt
* Payment state transition
* Inventory reduction

## 9. Financial Controls: `payment.paid`
The creation of the `payment.paid` state requires extreme control.
* **Mandatory Prerequisites:** Producing a `payment.paid` audit and transitioning the state REQUIRES:
    1. A verified webhook.
    2. Successful signature verification.
    3. Successful idempotency validation.
* **The Frontend Rule:** **Frontend activity alone may never produce `payment.paid`.** Only verified webhook processing may produce `payment.paid`.

## 10. Immutable Audit Requirements
* **Append-Only:** Audit records are append-only.
* **No Modification:** Audit records may never be modified.
* **No Deletion:** Audit records may never be deleted.
* **Permanent Retention:** Financial audit records require permanent retention for financial investigation, operational investigation, and dispute resolution.

## 11. Dependencies
* **Payment Domain Architecture:** Defines state definitions and reference rules.
* **Payment Provider Webhook Flow:** Dictates the processing stages that trigger audit events.

## 12. Open Questions
* None at this time.

## 13. Completion Criteria
* Audit event taxonomy is exhaustive for the Phase 5 scope.
* Correlation requirements ensure end-to-end transaction visibility.
* All stock mutations are traceably linked to verified payment successes.
* The system-only constraint on `payment.paid` is enforced within the audit specification.
