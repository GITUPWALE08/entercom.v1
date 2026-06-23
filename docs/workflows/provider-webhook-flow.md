# Payment Provider Webhook Workflow

## 1. Purpose
The purpose of this document is to define the authoritative processing workflow for incoming Payment Provider webhook notifications. It establishes the sequence of verification, validation, and transactional updates required to ensure that the platform state remains synchronized with the payment provider.

## 2. Scope
This workflow covers the handling of all server-to-server notifications from Payment Provider, specifically focusing on payment success and failure events.

## 3. Out of Scope
* Initial payment initialization.
* Frontend redirect handling.
* Notifications or WebSocket delivery (Phase 6).
* Manual dashboard verification.

## 4. Actors
* **Payment Provider:** External source of POST notifications.
* **Payment Domain:** Owner of verification and Payment records.
* **Order Domain:** Receiver of settlement status.
* **Product Domain:** Subject of atomic inventory reduction.

## 5. Workflow Diagram
```text
[Payment Provider] Emit Webhook
      ↓
[Listener] Verify HMAC Signature
      ↓
[Payment Domain] Idempotency Check
      ↓
[Database] Open Atomic Transaction
      ↓
[Payment Domain] Transition Payment to 'paid' or 'failed'
      ↓
[Database] Commit Transaction
      ↓
[System] Emit payment.paid or payment.failed
      ↓
[Order Domain] Consumes event and manages Order/Inventory
      ↓
[Listener] Return 200 OK
```

## 6. Processing Stages

### 6.1 Signature Verification
* **Action:** Platform extracts `x-provider-signature` and computes HMAC-SHA512 hash of the raw body.
* **Rule:** If signature is invalid, the webhook is rejected and the Payment transitions to `failed`.

### 6.2 Idempotency Check
* **Action:** Extract provider_reference.
* **Rule:** If the Payment record is already in a terminal state (`paid` or `cancelled`), acknowledge with HTTP 200 and exit.

### 6.3 Transactional Updates
* **Action:** Within a single `@transaction.atomic` block:
    1. **Update Payment:** Transition Payment to `paid` or `failed`. (Invalid webhooks result in `failed`).
    2. **Emit Events:** Generate `payment.paid` or `payment.failed`. PaymentService MUST NOT directly mutate Order state or trigger Inventory Reduction.

### 6.4 Handling Stock Depletion Race
* **Scenario:** If inventory becomes insufficient between order creation and payment success.
* **Rule:** The `paid` transition remains valid, but the system MUST block fulfillment and flag the order for **Manager Intervention**. No automatic refund is initiated in Phase 5.

## 7. Security & Audit Requirements
* **Canonical Truth:** Webhook is the only source of truth for payment success.
* **Audit Trail:** Verified payloads must be logged with the associated `correlation_id` and `actor_id` (System).

## 8. Completion Criteria
* No duplicate state changes occur for redundant webhooks.
* Inventory is reduced atomically only upon verified payment.
* Signature verification prevents spoofed state changes.
