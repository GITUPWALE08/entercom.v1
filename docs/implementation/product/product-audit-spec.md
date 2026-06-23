# Product Audit Specification Design

## Purpose
To define the immutable, forensic audit tracking specifications for the Product Domain in Phase 5.

## Scope
* Product audit actions
* Category audit actions
* Inventory audit actions

## Out of Scope
* Audit implementation code
* Signals and middleware
* Database models
* Event publisher logic

## Audit Inventory

| Action | Producer | Actor Type |
| ------ | -------- | ---------- |
| `product.created` | ProductService | STAFF, MANAGER, SUPERADMIN |
| `product.updated` | ProductService | STAFF, MANAGER, SUPERADMIN |
| `product.archived` | ProductService | MANAGER, SUPERADMIN |
| `category.created` | CategoryService | STAFF, MANAGER, SUPERADMIN |
| `category.updated` | CategoryService | STAFF, MANAGER, SUPERADMIN |
| `category.archived` | CategoryService | MANAGER, SUPERADMIN |
| `inventory.reduced` | InventoryService | SYSTEM |
| `inventory.adjusted` | InventoryService | MANAGER, SUPERADMIN |
| `inventory.low_stock` | InventoryService | SYSTEM |

## Action Specifications
*All audit records MUST contain: `audit_action`, `occurred_at`, `actor_id`, `actor_type`, `correlation_id`, `metadata`.*

| Action Name | Producer | Required Metadata | Correlation Requirements |
| ----------- | -------- | ----------------- | ------------------------ |
| `product.created` | ProductService | UNRESOLVED | Standard propagation |
| `product.updated` | ProductService | UNRESOLVED | Standard propagation |
| `product.archived` | ProductService | UNRESOLVED | Standard propagation |
| `category.created` | CategoryService | UNRESOLVED | Standard propagation |
| `category.updated` | CategoryService | UNRESOLVED | Standard propagation |
| `category.archived` | CategoryService | UNRESOLVED | Standard propagation |
| `inventory.reduced` | InventoryService | products_affected | Must share `correlation_id` with payment |
| `inventory.adjusted` | InventoryService | UNRESOLVED | Standard propagation |
| `inventory.low_stock` | InventoryService | UNRESOLVED | Standard propagation |

## Metadata Specifications

### `inventory.reduced`
| Field | Required | Description |
| ----- | -------- | ----------- |
| `products_affected` | Yes | Which products were affected by the reduction |
| UNRESOLVED | UNRESOLVED | UNRESOLVED — BUSINESS DECISION REQUIRED |

*(For all other actions: UNRESOLVED — BUSINESS DECISION REQUIRED)*

## Actor Requirements

| Action | Allowed Actor Types |
| ------ | ------------------- |
| `product.created` | STAFF, MANAGER, SUPERADMIN |
| `product.updated` | STAFF, MANAGER, SUPERADMIN |
| `product.archived` | MANAGER, SUPERADMIN |
| `category.created` | STAFF, MANAGER, SUPERADMIN |
| `category.updated` | STAFF, MANAGER, SUPERADMIN |
| `category.archived` | MANAGER, SUPERADMIN |
| `inventory.reduced` | SYSTEM |
| `inventory.adjusted` | MANAGER, SUPERADMIN |
| `inventory.low_stock` | SYSTEM |

## Correlation Rules
* The Correlation Chain must follow: Order → Payment → Webhook → Inventory.
* Explicitly required: `payment.initialized`, `payment.paid`, `webhook.received`, `inventory.reduced`, and `order.fulfilled` must share the same `correlation_id` whenever they belong to the same transaction chain.

## Financial Audit Requirements
* Financial actions are isolated.
* `inventory.reduced` must contain sufficient metadata to reconstruct which inventory reduction occurred and which products were affected.

## Forensic Recoverability
For every audit action:
* **Can this action alone identify Actor?** Yes (via `actor_id` and `actor_type`).
* **Can this action alone identify Product?** Yes (via `metadata`).
* **Can this action alone identify State Transition?** Yes (via `metadata`).
* **Order/Payment/Reference:** Dependent on `correlation_id` trace chain.

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
| `product.created` | `product.created` |
| `product.updated` | `product.updated` |
| `product.archived` | `product.archived` |
| `category.created` | `category.created` |
| `category.updated` | `category.updated` |
| `category.archived` | `category.archived` |
| `inventory.reduced` | `inventory.reduced` |
| `inventory.adjusted` | `inventory.adjusted` |
| `inventory.low_stock` | `inventory.low_stock` |

## Forbidden Behaviors
Explicitly prohibit:
* Deleting audit records
* Editing audit metadata
* Changing `correlation_id`
* Reassigning actors
* Generating audit records from frontend clients
* Frontend-created audit entries

## Dependencies
* docs/architecture/product/product-auditing.md
* docs/implementation/product/product-event-contracts.md
* docs/implementation/product/product-service-design.md

## Open Questions
UNRESOLVED — BUSINESS DECISION REQUIRED

## Completion Criteria
UNRESOLVED — BUSINESS DECISION REQUIRED
