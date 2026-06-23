# Payment Event Contracts

## 1. Purpose
The purpose of this document is to define the strict payload schemas, producer/consumer ownership, and transaction requirements for all events emitted by the Payment Domain. It establishes the architectural contract for signaling financial settlement, failure, and provider interactions, ensuring absolute traceability across the platform.

## 2. Scope
This document covers:
* Payment lifecycle events.
* Webhook tracking events.
* The standard event envelope.
* Idempotency and transaction requirements.

## 3. Out of Scope
* Technical implementation of the event broker.
* Celery task definitions.
* Python code generation.
* WebSockets and Notification delivery (Phase 6).

## 4. Dependencies
* **Payment Domain Architecture**
* **Payment Events Architecture**
* **Payment Model Design**
* **Payment Auditing Architecture**

## 5. Event Versioning Policy
* **Current Version:** `v1`
* **Versioning Rules:** Incremented if backward-incompatible changes are introduced.
* **Backward Compatibility Rules:** Adding optional fields maintains the current version.
* **Deprecation Rules:** Old versions supported for 90 days post-deprecation.

## 6. Standard Event Envelope
All events MUST define the following base fields.

| Field Name | Type | Required | Description | Example Value |
| :--- | :--- | :--- | :--- | :--- |
| `event_id` | UUID | Yes | Unique identifier for the event instance. | `a1b2c3d4-...` |
| `event_name` | String | Yes | The canonical name of the event. | `payment.paid` |
| `event_version`| String | Yes | The schema version. | `v1` |
| `occurred_at` | Datetime| Yes | ISO-8601 UTC timestamp of the mutation. | `2026-06-18T10:00:00Z`|
| `correlation_id`| UUID | Yes | Traceability identifier linking cross-domain flows.| `x9y8z7...` |
| `actor_id` | String | Yes | ID of the user or `SYSTEM` responsible for the change.| `SYSTEM` |
| `producer` | String | Yes | The originating service. | `WebhookService` |
| `data` | Object | Yes | The event-specific payload. | `{...}` |

## 7. Event Inventory & Payload Contracts

### 7.1 `payment.initialized`
* **Purpose:** Notify that a customer has begun a payment session (or retried).
* **Producer:** `PaymentService` (Trigger: Payment record creation or retry).
* **Consumers:** Audit System (Current).
* **Transaction Requirements:** Emit After Commit.
* **Idempotency Key:** `data.provider_reference`
* **Data Payload:**
    * `payment_id` (UUID, Required)
    * `order_id` (UUID, Required)
    * `request_id` (UUID, Required)
    * `provider_reference` (String, Required)
    * `amount` (Decimal, Required)

### 7.2 `payment.paid`
* **Purpose:** Notify that settlement is complete.
* **Producer:** `WebhookService` (Trigger: Verified Success Webhook).
* **Consumers:** OrderService (Current, orchestrates inventory reduction), Audit System (Current).
* **Transaction Requirements:** Emit After Commit.
* **Idempotency Key:** `data.provider_reference`
* **Data Payload:**
    * `payment_id` (UUID, Required)
    * `order_id` (UUID, Required)
    * `request_id` (UUID, Required)
    * `provider_reference` (String, Required)
    * `previous_state` (String, Required)
    * `new_state` (String, Required)
    * `amount` (Decimal, Required)

### 7.3 `payment.failed`
* **Purpose:** Notify that an attempt was declined.
* **Producer:** `WebhookService` (Trigger: Verified Failure Webhook or invalid webhook rejection).
* **Consumers:** OrderService (Current), Audit System (Current).
* **Transaction Requirements:** Emit After Commit.
* **Idempotency Key:** `data.provider_reference`
* **Data Payload:**
    * `payment_id` (UUID, Required)
    * `order_id` (UUID, Required)
    * `request_id` (UUID, Required)
    * `provider_reference` (String, Required)
    * `previous_state` (String, Required)
    * `new_state` (String, Required)

### 7.4 `payment.cancelled`
* **Purpose:** Notify of payment termination due to order cancellation.
* **Producer:** `PaymentService` (Trigger: Order cancellation signal).
* **Consumers:** Audit System (Current).
* **Transaction Requirements:** Emit After Commit.
* **Idempotency Key:** `data.payment_id`
* **Data Payload:**
    * `payment_id` (UUID, Required)
    * `order_id` (UUID, Required)
    * `request_id` (UUID, Required)
    * `provider_reference` (String, Required)
    * `previous_state` (String, Required)
    * `new_state` (String, Required)

### 7.5 `payment.expired`
* **Purpose:** Notify of 24h expiration.
* **Producer:** Background Job (Trigger: Expiration sweep).
* **Consumers:** OrderService (Current), Audit System (Current).
* **Transaction Requirements:** Emit After Commit.
* **Idempotency Key:** `data.payment_id`
* **Data Payload:**
    * `payment_id` (UUID, Required)
    * `order_id` (UUID, Required)
    * `request_id` (UUID, Required)
    * `provider_reference` (String, Required)
    * `previous_state` (String, Required)
    * `new_state` (String, Required)

### 7.6 `webhook.received`
* **Purpose:** Forensic record of provider communication.
* **Producer:** `WebhookService` (Trigger: HTTP POST arrival).
* **Consumers:** Audit System (Current).
* **Transaction Requirements:** Emit After Commit (or independent async log if main transaction fails).
* **Idempotency Key:** Webhook Event ID (from Payment Provider payload).
* **Data Payload:**
    * `webhook_provider` (String, Required: "provider")
    * `event_name` (String, Required)
    * `provider_reference` (String, Required)

### 7.7 `webhook.rejected`
* **Purpose:** Forensic record of invalid provider attempts.
* **Producer:** `WebhookService` (Trigger: HMAC/Idempotency failure).
* **Consumers:** Audit System (Current).
* **Transaction Requirements:** Emit Immediately (no business transaction to commit).
* **Idempotency Key:** Webhook Event ID.
* **Data Payload:**
    * `rejection_reason` (String, Required)
    * `webhook_provider` (String, Required)
    * `provider_reference` (String, Required)

## 8. Audit Requirements
* **Audit Required:** Yes, for all listed events.
* **Required Audit Action:** Matches `event_name`.
* **Metadata Requirements:** Full payload tracing, specifically enforcing `correlation_id` logging.

## 9. Contract Validation Rules
* **Required Fields:** Strict enforcement.
* **Nullable Fields:** None in the payment domain event payloads.
* **Type Validation:** Enforced.

## 10. Future Integration Notes
* **Notification consumers:** Future phase will notify customers upon `payment.paid` or `payment.failed`.

## 11. Forbidden Event Behavior
* **Explicitly Prohibit:** `PaymentService` emitting `order.created` or `order.fulfilled`.
* **Explicitly Prohibit:** Webhook bypassing `PaymentService` validation. Frontend activity may NEVER produce `payment.paid`.
* **Explicitly Prohibit:** Event emission inside an uncommitted transaction (except for rejection logs).

## 12. Open Questions
No unresolved event-contract questions remain.

## 13. Completion Criteria
* `payment.paid` is strictly mapped to `WebhookService` as the sole producer.
* All payloads support full forensic tracing back to the `request_id`.
* The difference between `cancelled` (user action) and `expired` (system job) is defined via separate events.
