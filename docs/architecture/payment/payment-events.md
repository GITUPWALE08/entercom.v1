# Payment Domain Event Architecture

## 1. Purpose
The purpose of this document is to define the Domain Events emitted by the Payment aggregate and the Webhook processor. It establishes the architectural contract for signaling financial settlement and provider interactions, ensuring absolute integrity, traceability, and secure cross-domain synchronization.

## 2. Scope
This document covers:
* Event taxonomy for Payment lifecycle transitions.
* Event taxonomy for external Webhook interactions.
* Required payload fields for financial messages.
* Security constraints regarding authoritative producers.

## 3. Out of Scope
* Technical implementation of the event bus or message broker.
* Notification dispatch or WebSocket routing (Phase 6).
* Refund or Chargeback events (Excluded from Phase 5).
* Order or Product domain events (Covered in separate documents).

## 4. Definitions
* **Authoritative Producer:** The specific service securely verified to emit high-risk events (e.g., `WebhookService`).
* **Canonical Truth:** The principle that server-to-server communication dictates state changes.
* **Correlation ID:** A persistent identifier linking the Payment event chain back to the Order and Request.

## 5. Event Taxonomy

### 5.1 Payment Events
| Event Name | Purpose | Trigger | Producer |
| :--- | :--- | :--- | :--- |
| `payment.initialized` | Notify that a customer has begun a payment session. | Payment record creation. | `PaymentService` |
| `payment.paid` | Notify that settlement is complete. | Verified Webhook. | `WebhookService` |
| `payment.failed` | Notify that an attempt was declined. | Verified Failure Webhook. | `WebhookService` |
| `payment.cancelled` | Notify of 24h expiration or manual order termination. | Expiration job/Order signal. | `PaymentService` |

### 5.2 Webhook Events
| Event Name | Purpose | Trigger | Producer |
| :--- | :--- | :--- | :--- |
| `webhook.received` | Forensic record of provider communication. | HTTP POST arrival. | `WebhookService` |
| `webhook.rejected` | Forensic record of invalid provider attempts. Results in payment.failed. | HMAC/Idempotency failure. | `WebhookService` |

## 6. Detailed Event Specifications & Payloads

### 6.1 `payment.initialized`
* **Producer:** `PaymentService`
* **Payload Requirements:** 
    * `payment_id`, `order_id`, `request_id`, `provider_reference`, `amount`, `correlation_id`, `timestamp`.

### 6.2 `payment.paid`
* **Producer:** `WebhookService`
* **Security Rule:** **Only verified Payment Provider webhooks may produce `payment.paid`. Frontend activity may never produce `payment.paid`. Webhook is the sole authority.**
* **Payload Requirements:** 
    * `payment_id`, `order_id`, `request_id`, `provider_reference`, `previous_state`, `new_state`, `amount`, `correlation_id`, `timestamp`.

### 6.3 `payment.failed`
* **Producer:** `WebhookService`
* **Payload Requirements:** 
    * `payment_id`, `order_id`, `request_id`, `provider_reference`, `previous_state`, `new_state`, `correlation_id`, `timestamp`.

### 6.4 `payment.cancelled`
* **Producer:** `PaymentService`
* **Payload Requirements:** 
    * `payment_id`, `order_id`, `request_id`, `provider_reference`, `previous_state`, `new_state`, `correlation_id`, `timestamp`.

### 6.5 `webhook.received`
* **Producer:** `WebhookService`
* **Payload Requirements:** 
    * `webhook_provider`, `event_name`, `provider_reference`, `correlation_id`, `timestamp`.

### 6.6 `webhook.rejected`
* **Producer:** `WebhookService`
* **Payload Requirements:** 
    * `rejection_reason`, `webhook_provider`, `provider_reference`, `correlation_id`, `timestamp`.

## 7. Consumers
* **Audit Domain:** Mandatory consumer for all events.
* **Order Domain:** Consumes `payment.paid` to transition the Order and `payment.failed` to unlock retries.
* **Inventory Domain:** Indirectly consumes `payment.paid` (via Order Domain or atomic transaction) to trigger `inventory.reduced`.

## 8. Payload Requirements
Every event MUST include the following base fields for routing and security:
* `event_id` (UUID)
* `event_name` (String)
* `occurred_at` (Timestamp)
* `correlation_id` (UUID)
* `actor_id` (UUID or "SYSTEM")

## 9. Audit Requirements
All Payment and Webhook events must be captured immutably by the auditing subsystem. Financial transitions are considered high-risk and require exhaustive `correlation_id` tracing.

## 10. Dependencies
* **Payment Services:** Authoritative producers.
* **Payment Provider API:** External source of truth for webhook payloads.

## 11. Open Questions
* **UNRESOLVED — BUSINESS DECISION REQUIRED:** For `webhook.rejected`, should the raw payload be included in the event data for debugging, or omitted to prevent potential PII/secret leakage from malicious actors?

## 12. Completion Criteria
* The canonical truth rule regarding `payment.paid` is strictly enforced at the event level.
* Forensic webhooks (`received`/`rejected`) are codified to ensure provider transparency.
* All payload schemas match the cross-domain correlation requirements.
