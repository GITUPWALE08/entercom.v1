# Payment Service Implementation Design

## Purpose
To define the concrete implementation responsibilities, transaction boundaries, and event orchestration for the Payment Domain services.

## Scope
* PaymentService
* WebhookService

## Out of Scope
* Django ORM code generation
* Serializers
* APIs
* Method implementations
* Direct mutation of Order or Inventory states

## Definitions
UNRESOLVED — BUSINESS DECISION REQUIRED

## Service Inventory
1. PaymentService
2. WebhookService

## Detailed Service Sections

### 1. PaymentService
#### Purpose
To orchestrate the internal Payment aggregate lifecycle, handle retries, and manage network requests to the payment provider.
#### Ownership
Owns payment initialization, payment cancellation, and payment expiration. Data ownership of `Payment` entity states (`pending`, `failed`, `cancelled`), and `provider_reference` generation.
#### Responsibilities
Handles the initial creation of the Payment aggregate. On retry, updates the existing record with a newly generated `provider_reference`. Dispatches network requests to the Payment Provider. Scans for and transitions orphaned payments to `cancelled` after 24 hours.
#### Inputs
`order_id`, requested payment amount, and customer metadata.
#### Outputs
Instantiated or updated `Payment` record; Provider checkout URLs.
#### Validations Owned
Validates that payments transition to `cancelled` strictly after 24 hours of inactivity.
#### Permissions Enforced
Enforces `payment.initialize` (Customer-own, Superadmin). Expiration is a System-owned background action.
#### Audit Actions Produced
Logs `payment.initialized` and `payment.cancelled`.
#### Events Produced
Emits `payment.initialized` and `payment.cancelled`.
#### Transaction Boundaries
**Payment Initialization Transaction:** Atomically creates the `Payment` record (or updates the `provider_reference` for retries).
**Payment Expiry Transaction:** A scheduled atomic block that locks expired `pending`/`failed` payments, transitions them to `cancelled`.
#### Cross-Service Dependencies
None internally. Relies on external Payment Provider network APIs.
#### Forbidden Responsibilities
PaymentService never marks `payment.paid`. PaymentService never reduces inventory.
#### Failure Handling
Network failures during initialization gracefully bubble up to the user.
#### Idempotency Requirements
Retrying a failed payment utilizes the same database row.
#### Completion Criteria
Strict 1:1 Order-Payment mapping is respected even during retry workflows.

### 2. WebhookService
#### Purpose
To act as the authoritative, secure processor for asynchronous state changes sent by the payment provider.
#### Ownership
Owns `webhook.received`, `webhook.rejected`, `payment.paid`, and `payment.failed`.
#### Responsibilities
Rejects any payload that fails HMAC verification. Evaluates the `provider_reference` to prevent duplicate processing. Transitions Payment records to `paid` or `failed` based on the payload.
#### Inputs
Raw JSON webhook payload and provider signature HTTP headers.
#### Outputs
Updated `Payment` status.
#### Validations Owned
WebhookService must verify Paystack signatures.
#### Permissions Enforced
Enforces `webhook.process` (System-owned action. Accepts unauthenticated requests ONLY if they pass HMAC verification).
#### Audit Actions Produced
Logs `webhook.received`, `webhook.rejected`, `payment.paid`, or `payment.failed`.
#### Events Produced
Emits `payment.paid` or `payment.failed`.
#### Transaction Boundaries
**Webhook Processing Transaction:** MUST use strict row-level database locking (`select_for_update`) on the Payment record to ensure atomic processing against concurrent webhook deliveries.
#### Cross-Service Dependencies
None.
#### Forbidden Responsibilities
WebhookService must never mutate inventory directly. WebhookService must never fulfill orders.
#### Failure Handling
Immediate rejection and exit for missing headers, malformed JSON, or failed HMAC checks.
#### Idempotency Requirements
WebhookService must be idempotent. If the payment is already `paid` or `cancelled`, the service must acknowledge the webhook HTTP request with 200 OK and exit.
#### Completion Criteria
Webhook processing is perfectly idempotent and cryptographically secure.

## Transaction Matrix
* **Payment Initialization Transaction:** Defined in PaymentService.
* **Payment Expiry Transaction:** Defined in PaymentService.
* **Webhook Processing Transaction:** Defined in WebhookService.

## Ownership Matrix
* **PaymentService:** payment initialization, payment cancellation, payment expiration.
* **WebhookService:** webhook.received, webhook.rejected, payment.paid, payment.failed.

## Forbidden Interactions
* PaymentService MUST NOT mutate orders.
* PaymentService MUST NOT mutate inventory.
* WebhookService MUST NOT reduce inventory.
* WebhookService MUST NOT fulfill orders.

## Dependencies
* docs/architecture/payment/payment-domain.md
* docs/architecture/payment/payment-services.md
* docs/architecture/payment/payment-events.md
* docs/architecture/payment/payment-permissions.md
* docs/architecture/payment/payment-auditing.md
* docs/workflows/payment-lifecycle.md
* docs/workflows/paystack-webhook-flow.md
* docs/implementation/payment/payment-model-design.md

## Open Questions
UNRESOLVED — BUSINESS DECISION REQUIRED

## Completion Criteria
UNRESOLVED — BUSINESS DECISION REQUIRED
