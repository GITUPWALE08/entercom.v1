# Payment Service Implementation Design

## 1. Purpose
The purpose of this document is to define the concrete implementation responsibilities, transaction boundaries, and event orchestration for the Payment Domain services. It establishes the strict rules governing authoritative webhook processing, idempotency, and the 24-hour expiration lifecycle.

## 2. Scope
This document covers:
* `PaymentService`
* `ProviderService`
* `WebhookService`

## 3. Out of Scope
* Django ORM code generation.
* Refunds, chargebacks, installments.
* Direct mutation of Order or Inventory states.

## 4. Dependencies
* **Payment Domain Architecture**
* **Payment Model Design**
* **Payment Permissions Architecture**
* **Payment Auditing Architecture**

## 5. Service Inventory

### 5.1 PaymentService
* **Purpose:** Orchestrator for the internal Payment aggregate lifecycle.
* **Ownership:** Payment states (`pending`, `failed`, `cancelled`), `provider_reference` generation.
* **Consumers:** API Views, Background Jobs (Expiry).
* **Dependencies:** ProviderService.

### 5.2 ProviderService
* **Purpose:** Encapsulated API client for provider communication.
* **Ownership:** Verification payloads and network requests to Payment Provider.
* **Consumers:** PaymentService, WebhookService.
* **Dependencies:** None.

### 5.3 WebhookService
* **Purpose:** Authoritative processor for incoming provider state changes.
* **Ownership:** Signature verification, idempotency checking, and processing `payment.paid` transitions.
* **Consumers:** Webhook endpoints.
* **Dependencies:** ProviderService (for verification algorithms).

## 6. Responsibilities & Ownership Rules

### 6.1 PaymentService
* **Owns:** Payment initialization, generating new `provider_reference` on retry (using the SAME payment record), and transitioning payments to `cancelled` upon 24-hour expiration.
* **Does NOT Own:** Updating Order state, reducing inventory, or transitioning payments to `paid`.

### 6.2 ProviderService
* **Owns:** Cryptographic HMAC-SHA512 verification logic.
* **Does NOT Own:** Business state transitions, database commits, or event emissions.

### 6.3 WebhookService
* **Owns:** Enforcing canonical truth. Updating Payment records to `paid` or `failed` based on verified webhook payloads.
* **Does NOT Own:** Direct modification of Order status or Inventory reduction (must emit events instead).

## 7. Operation Specifications

### 7.1 Payment Initialization & Retry (PaymentService)
* **Transaction Required:** Yes.
* **Why:** Atomic creation or update of the Payment record and reference.
* **Permission Enforcement:** `payment.initialize`. Restricted to Customer (own) or Superadmin.
* **Operation Logic:** If retrying a `failed` payment, update the existing record with a newly generated `provider_reference`.
* **Audit Actions:** `payment.initialized`.
* **Event Emission:** `payment.initialized`. Emitted `on_commit`.

### 7.2 Webhook Processing (WebhookService)
* **Transaction Required:** Yes.
* **Why:** Prevents duplicate processing of the same payload.
* **Atomicity Requirements:** Uses `select_for_update` on the Payment record to enforce idempotency.
* **Permission Enforcement:** `webhook.process`. System-owned action ONLY.
* **Operation Logic:** 
    1. Verify Signature (Fail -> emit `webhook.rejected`, transition Payment to `failed` if applicable, exit).
    2. Check Idempotency (If already `paid`/`cancelled`, acknowledge and exit).
    3. Transition Payment to `paid` or `failed`.
* **Audit Actions:** `webhook.received`, `payment.paid` or `payment.failed`. Requires `correlation_id` and raw payload tracking.
* **Event Emission:** `payment.paid` or `payment.failed`. Emitted `on_commit`.

### 7.3 Payment Expiration (PaymentService)
* **Transaction Required:** Yes.
* **Why:** Ensures atomic cancellation.
* **Permission Enforcement:** System-owned action (Background Job).
* **Operation Logic:** Finds `pending` or `failed` payments older than 24 hours and transitions them to `cancelled`.
* **Audit Actions:** `payment.cancelled`.
* **Event Emission:** `payment.cancelled`. Emitted `on_commit`.

## 8. Cross-Service Interaction Matrix
* `WebhookService` → calls → `ProviderService` (To verify HMAC signature).
* `PaymentService` → calls → `ProviderService` (To obtain initial transaction links/references).

## 9. Forbidden Interactions
* `PaymentService` MUST NOT directly mutate Order state.
* `WebhookService` MUST NOT directly mutate Order state.
* `WebhookService` MUST NOT trigger Inventory Reduction.
* `Request Domain` MUST NOT mutate payments.

## 10. Failure Handling
* **Validation Failure:** Webhooks with missing headers or malformed JSON result in immediate rejection and `webhook.rejected` audit logs.
* **Permission Failure:** Webhook endpoint rejects any authenticated user requests; it only accepts unauthenticated POSTs from the provider IPs.
* **Concurrency/Idempotency Failure:** Concurrent webhooks for the same reference block on row-level locks. The first to commit transitions the state; subsequent processes detect the terminal state and exit idempotently.

## 11. Open Questions
No unresolved service-layer questions remain.

## 12. Completion Criteria
* Webhook is established as the sole mechanism for achieving the `paid` state.
* The separation of concerns between Payment state (WebhookService) and Order state (OrderService via Events) is rigidly codified.
* Retry logic strictly reuses the existing Payment record while generating a new reference.
