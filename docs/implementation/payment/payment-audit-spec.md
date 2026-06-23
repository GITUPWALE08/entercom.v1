# Payment Audit Specification Design

## Purpose
To define the immutable, forensic audit tracking specifications for the Payment Domain in Phase 5.

## Scope
* Payment audit actions
* Webhook audit actions

## Out of Scope
* Audit implementation code
* Signals and middleware
* Database models
* Event publisher logic

## Audit Inventory

| Action | Producer | Actor Type |
| ------ | -------- | ---------- |
| `payment.initialized` | PaymentService | CUSTOMER, SUPERADMIN |
| `payment.paid` | WebhookService | WEBHOOK |
| `payment.failed` | WebhookService | WEBHOOK |
| `payment.cancelled` | PaymentService | MANAGER, SUPERADMIN, SYSTEM |
| `payment.expired` | Payment Expiry Job | SYSTEM |
| `webhook.received` | WebhookService | WEBHOOK |
| `webhook.rejected` | WebhookService | WEBHOOK |

## Action Specifications
*All audit records MUST contain: `audit_action`, `occurred_at`, `actor_id`, `actor_type`, `correlation_id`, `metadata`.*

| Action Name | Producer | Required Metadata | Correlation Requirements |
| ----------- | -------- | ----------------- | ------------------------ |
| `payment.initialized` | PaymentService | UNRESOLVED | Share correlation chain |
| `payment.paid` | WebhookService | order_id, payment_id, paystack_reference, amount, currency, previous_state, new_state | Share correlation chain |
| `payment.failed` | WebhookService | UNRESOLVED | Share correlation chain |
| `payment.cancelled` | PaymentService | UNRESOLVED | Standard propagation |
| `payment.expired` | Payment Expiry Job | UNRESOLVED | Standard propagation |
| `webhook.received` | WebhookService | UNRESOLVED | Share correlation chain |
| `webhook.rejected` | WebhookService | UNRESOLVED | Share correlation chain |

## Metadata Specifications

### `payment.paid`
| Field | Required | Description |
| ----- | -------- | ----------- |
| `order_id` | Yes | The ID of the order paid |
| `payment_id` | Yes | The ID of the payment record |
| `paystack_reference` | Yes | The provider transaction reference |
| `amount` | Yes | The payment amount |
| `currency` | Yes | The currency used |
| `previous_state` | Yes | Payment state prior to webhook |
| `new_state` | Yes | The target state (`paid`) |

*(For all other actions: UNRESOLVED — BUSINESS DECISION REQUIRED)*

## Actor Requirements

| Action | Allowed Actor Types |
| ------ | ------------------- |
| `payment.initialized` | CUSTOMER, SUPERADMIN |
| `payment.paid` | WEBHOOK |
| `payment.failed` | WEBHOOK |
| `payment.cancelled` | MANAGER, SUPERADMIN, SYSTEM |
| `payment.expired` | SYSTEM |
| `webhook.received` | WEBHOOK |
| `webhook.rejected` | WEBHOOK |

## Correlation Rules
* The Correlation Chain must follow: Order → Payment → Webhook → Inventory.
* Explicitly required: `payment.initialized`, `payment.paid`, `webhook.received`, `inventory.reduced`, and `order.fulfilled` must share the same `correlation_id` whenever they belong to the same transaction chain.

## Financial Audit Requirements
* Financial actions are isolated.
* Actions must contain sufficient metadata to reconstruct:
  * Who initiated payment
  * What order was paid
  * Which webhook confirmed payment
  * Which paystack_reference was used

## Forensic Recoverability
For every audit action:
* **Can this action alone identify Actor?** Yes (via `actor_id` and `actor_type`).
* **Can this action alone identify Payment?** Yes (via `metadata`).
* **Can this action alone identify Reference?** Yes (via `paystack_reference` in metadata).
* **Can this action alone identify State Transition?** Yes (via `previous_state` and `new_state`).

## Immutability Requirements
Explicitly documented for all audit records:
* **Never Editable:** Records cannot be altered post-creation.
* **Never Deletable:** Records cannot be removed from the forensic log.
* **Retain Full Metadata:** Original context must be preserved exactly as it occurred.
* **Retain Actor Context:** The specific actor triggering the change must be locked.
* **Retain Correlation Context:** Cross-domain trace ID must be locked.
* **Retain Historical Values:** Prior state must be recoverable.

## Audit ↔ Event Mapping

| Audit Action | Matching Event |
| ------------ | -------------- |
| `payment.initialized` | `payment.initialized` |
| `payment.paid` | `payment.paid` |
| `payment.failed` | `payment.failed` |
| `payment.cancelled` | `payment.cancelled` |
| `payment.expired` | `payment.expired` |
| `webhook.received` | `webhook.received` |
| `webhook.rejected` | `webhook.rejected` |

## Forbidden Behaviors
Explicitly prohibit:
* Deleting audit records
* Editing audit metadata
* Changing `correlation_id`
* Reassigning actors
* Generating audit records from frontend clients
* Frontend-created audit entries

## Dependencies
* docs/architecture/payment/payment-auditing.md
* docs/implementation/payment/payment-event-contracts.md
* docs/implementation/payment/payment-service-design.md

## Open Questions
UNRESOLVED — BUSINESS DECISION REQUIRED

## Completion Criteria
UNRESOLVED — BUSINESS DECISION REQUIRED
