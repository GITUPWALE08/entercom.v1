# Order Audit Specification Design

## Purpose
To define the immutable, forensic audit tracking specifications for the Order Domain in Phase 5.

## Scope
* Order audit actions

## Out of Scope
* Audit implementation code
* Signals and middleware
* Database models
* Event publisher logic

## Audit Inventory

| Action | Producer | Actor Type |
| ------ | -------- | ---------- |
| `order.created` | OrderService | CUSTOMER |
| `order.cancelled` | OrderService | CUSTOMER, MANAGER, SUPERADMIN |
| `order.fulfilled` | OrderService | STAFF, MANAGER, SUPERADMIN |
| `order.payment_required` | OrderService | SYSTEM |

## Action Specifications
*All audit records MUST contain: `audit_action`, `occurred_at`, `actor_id`, `actor_type`, `correlation_id`, `metadata`.*

| Action Name | Producer | Required Metadata | Correlation Requirements |
| ----------- | -------- | ----------------- | ------------------------ |
| `order.created` | OrderService | UNRESOLVED | Chain initiator |
| `order.cancelled` | OrderService | UNRESOLVED | Standard propagation |
| `order.fulfilled` | OrderService | order_id | Must share `correlation_id` with payment |
| `order.payment_required` | OrderService | UNRESOLVED | Standard propagation |

## Metadata Specifications

### `order.fulfilled`
| Field | Required | Description |
| ----- | -------- | ----------- |
| `order_id` | Yes | Which order was fulfilled |
| UNRESOLVED | UNRESOLVED | UNRESOLVED — BUSINESS DECISION REQUIRED |

*(For all other actions: UNRESOLVED — BUSINESS DECISION REQUIRED)*

## Actor Requirements

| Action | Allowed Actor Types |
| ------ | ------------------- |
| `order.created` | CUSTOMER |
| `order.cancelled` | CUSTOMER, MANAGER, SUPERADMIN |
| `order.fulfilled` | STAFF, MANAGER, SUPERADMIN |
| `order.payment_required` | SYSTEM |

## Correlation Rules
* The Correlation Chain must follow: Order → Payment → Webhook → Inventory.
* Explicitly required: `payment.initialized`, `payment.paid`, `webhook.received`, `inventory.reduced`, and `order.fulfilled` must share the same `correlation_id` whenever they belong to the same transaction chain.

## Financial Audit Requirements
* Financial actions are isolated.
* Audit trail must contain sufficient metadata to reconstruct what order was paid and who initiated payment.

## Forensic Recoverability
For every audit action:
* **Can this action alone identify Actor?** Yes (via `actor_id` and `actor_type`).
* **Can this action alone identify Order?** Yes (via `metadata` or correlation chain).
* **Can this action alone identify State Transition?** Yes (via `metadata`).

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
| `order.created` | `order.created` |
| `order.cancelled` | `order.cancelled` |
| `order.fulfilled` | `order.fulfilled` |
| `order.payment_required` | UNRESOLVED — BUSINESS DECISION REQUIRED |

## Forbidden Behaviors
Explicitly prohibit:
* Deleting audit records
* Editing audit metadata
* Changing `correlation_id`
* Reassigning actors
* Generating audit records from frontend clients
* Frontend-created audit entries

## Dependencies
* docs/architecture/order/order-auditing.md
* docs/implementation/order/order-event-contracts.md
* docs/implementation/order/order-service-design.md

## Open Questions
UNRESOLVED — BUSINESS DECISION REQUIRED

## Completion Criteria
UNRESOLVED — BUSINESS DECISION REQUIRED
