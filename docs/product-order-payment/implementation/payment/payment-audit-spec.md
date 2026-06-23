# Payment Audit Specification

## 1. Purpose
The purpose of this document is to define the strict implementation requirements for the Payment Domain audit trail. It establishes the forensic logging contracts required to isolate and immutably record every financial state transition and external webhook interaction, ensuring that no financial action occurs without absolute traceability.

## 2. Scope
This document covers:
* The standard audit record structure for Payments.
* Detailed metadata requirements for Payment lifecycle actions.
* Detailed metadata requirements for Webhook processing actions.
* Mandatory financial controls ensuring `payment.paid` is generated securely.
* Correlation ID and immutable storage expectations.

## 3. Out of Scope
* Inventory reduction auditing (Covered in Product Auditing).
* Notifications and WebSockets.
* Technical database schema design.

## 4. Dependencies
* **Payment Auditing Architecture**
* **Payment Service Implementation Design**
* **Payment Provider Webhook Flow**

## 5. Audit Principles
* **Financial Isolation:** Financial actions are isolated from standard CRUD logs.
* **Immutability:** Financial actions are immutable. Audit records may never be modified or deleted.
* **Append-Only:** Audit records are append-only. They never modify historical entries.
* **Always Auditable:** Webhook interactions are always auditable, regardless of success or failure.

## 6. Standard Audit Record Structure
Every audit record emitted by the Payment Domain MUST define the following base fields:

| Field Name | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `action` | String | Yes | Canonical action name (e.g., `payment.paid`). |
| `actor_id` | String | Yes | ID of the user or `SYSTEM`. |
| `actor_type` | String | Yes | `Customer`, `Manager`, `Superadmin`, `System`. |
| `resource_type` | String | Yes | `Payment` or `Webhook`. |
| `resource_id` | String | Yes | Primary key of the mutated entity or webhook ID. |
| `correlation_id`| String | Yes | Identifier linking cross-domain flows. |
| `occurred_at` | Datetime| Yes | ISO-8601 UTC timestamp. |
| `metadata` | JSON | Yes | Action-specific payloads and state deltas. |

## 7. Action Inventory & Metadata Requirements

### 7.1 Payment Actions

#### `payment.initialized`
* **Purpose:** Audit the creation or retry of a payment attempt.
* **Producer:** `PaymentService`
* **Actor Requirements:** Customer or Superadmin.
* **Required Metadata:**
    * `payment_id`
    * `order_id`
    * `request_id`
    * `provider_reference`
    * `amount`
    * `currency`

#### `payment.paid`
* **Purpose:** Audit the definitive settlement of a transaction.
* **Producer:** `WebhookService`
* **Actor Requirements:** `SYSTEM` (Webhook Processor ONLY).
* **Required Metadata:**
    * `payment_id`
    * `order_id`
    * `provider_reference`
    * `amount`
    * `currency`
    * `previous_state`
    * `new_state` (Must be `paid`)

#### `payment.failed`
* **Purpose:** Audit a confirmed decline from the payment provider.
* **Producer:** `WebhookService`
* **Actor Requirements:** `SYSTEM`.
* **Required Metadata:**
    * `payment_id`
    * `provider_reference`
    * `previous_state`
    * `new_state` (Must be `failed`)

#### `payment.cancelled`
* **Purpose:** Audit administrative termination.
* **Producer:** `PaymentService`
* **Actor Requirements:** Manager, Superadmin.
* **Required Metadata:**
    * `payment_id`
    * `provider_reference`
    * `previous_state`
    * `new_state` (Must be `cancelled`)

#### `payment.expired`
* **Purpose:** Audit 24-hour timeout termination.
* **Producer:** `PaymentService` (Background Job)
* **Actor Requirements:** `SYSTEM`.
* **Required Metadata:**
    * `payment_id`
    * `provider_reference`
    * `previous_state`
    * `new_state` (Must be `cancelled`)

### 7.2 Webhook Actions

#### `webhook.received`
* **Purpose:** Audit the arrival of data from the provider.
* **Producer:** `WebhookService`
* **Actor Requirements:** `SYSTEM`.
* **Required Metadata:**
    * `provider` ("provider")
    * `provider_reference`
    * `event_name`
    * `signature_verified` (Boolean - True if hash matches)

#### `webhook.rejected`
* **Purpose:** Audit unauthorized or invalid provider attempts.
* **Producer:** `WebhookService`
* **Actor Requirements:** `SYSTEM`.
* **Required Metadata:**
    * `provider`
    * `provider_reference`
    * `rejection_reason` (e.g., "Invalid Signature", "Duplicate Event")
    * `signature_verified` (Boolean)

## 8. Correlation ID Rules
* **Generation Rules:** Initialized by `PaymentService` upon creation.
* **Propagation Rules:** Webhooks matching a known `provider_reference` MUST retrieve and adopt the `correlation_id` of the existing Payment record.
* **Reuse Rules:** `payment.initialized`, `webhook.received`, `payment.paid`, and the resulting `inventory.reduced` MUST share the exact same `correlation_id`.

## 9. Financial Controls for `payment.paid`
* **Mandatory Control:** Creating a `payment.paid` audit record REQUIRES:
    1. A verified webhook (`signature_verified: true`).
    2. Successful idempotency validation (not already paid/cancelled).
* **The Frontend Rule:** Frontend activity alone may NEVER produce a `payment.paid` audit. Only verified webhook processing may produce `payment.paid`.

## 10. Immutable Audit Expectations
* **Fields never editable:** All base fields and metadata payload.
* **Fields never deletable:** All financial audit records.
* **Historical retention expectations:** Permanent retention is mandated for all Payment and Webhook audits for financial investigation and dispute resolution.

## 11. Audit Producer Matrix
| Service | Audit Actions |
| :--- | :--- |
| `PaymentService` | `payment.initialized`, `payment.cancelled`, `payment.expired` |
| `WebhookService` | `payment.paid`, `payment.failed`, `webhook.received`, `webhook.rejected` |

## 12. Forbidden Audit Behavior
* Explicitly prohibit: Editing financial audit records.
* Explicitly prohibit: Deleting audit records.
* Explicitly prohibit: Webhook state mutation without emitting `webhook.received` and `payment.paid`/`payment.failed`.
* Explicitly prohibit: Missing actor attribution (must explicitly define `SYSTEM` for webhooks/jobs).

## 13. Open Questions
No unresolved audit specification questions remain.

## 14. Completion Criteria
* `payment.paid` is strictly guarded by the verified webhook requirement.
* Forensic data for webhooks (`received`/`rejected`) is fully specified without storing sensitive secrets.
* Permanent retention and immutability are explicitly codified for financial actions.
