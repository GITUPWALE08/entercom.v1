# Product Event Contracts Design

## Purpose
To define the immutable, canonical event contracts for the Product Domain in Phase 5.

## Scope
* Product events
* Category events
* Inventory events

## Out of Scope
* Event publisher implementation
* Consumer implementation
* Celery task definitions
* WebSocket logic

## Event Inventory

| Event | Producer | Consumers |
| ----- | -------- | --------- |
| `product.created` | ProductService | Audit Framework, Analytics (Future) |
| `product.updated` | ProductService | Audit Framework, Analytics (Future) |
| `product.archived` | ProductService | Audit Framework, Analytics (Future) |
| `category.created` | CategoryService | Audit Framework, Analytics (Future) |
| `category.updated` | CategoryService | Audit Framework, Analytics (Future) |
| `category.archived` | CategoryService | Audit Framework, Analytics (Future) |
| `inventory.reduced` | InventoryService | Audit Framework, Analytics (Future) |
| `inventory.adjusted` | InventoryService | Audit Framework, Analytics (Future) |
| `inventory.low_stock` | InventoryService | Future Notification Service (Phase 6), Audit Framework |

## Versioning Strategy
* **Event Version:** Every event uses `event_version = 1`.
* **Future Breaking Change Policy:** Events are immutable and append-only. Breaking changes will require a new `event_version` number and a deprecation period for version 1.
* **Backward Compatibility Expectations:** Consumers must ignore unrecognized fields within the `data` payload. Required fields in v1 will never be removed.

## Event Contracts

### Global Envelope
All events MUST contain:
| Field | Required | Type | Description |
| ----- | -------- | ---- | ----------- |
| `event_name` | Yes | string | Name of the event |
| `event_version` | Yes | integer | Version of the event schema (always 1) |
| `correlation_id` | Yes | string | Cross-domain trace identifier |
| `occurred_at` | Yes | datetime | Timestamp of occurrence |
| `producer` | Yes | string | Service that published the event |
| `data` | Yes | object | Event-specific payload data |

### Specific Payload Schemas (`data` field)

#### `product.*`
| Field | Required | Type | Description |
| ----- | -------- | ---- | ----------- |
| UNRESOLVED | UNRESOLVED | UNRESOLVED | UNRESOLVED — BUSINESS DECISION REQUIRED |

#### `category.*`
| Field | Required | Type | Description |
| ----- | -------- | ---- | ----------- |
| UNRESOLVED | UNRESOLVED | UNRESOLVED | UNRESOLVED — BUSINESS DECISION REQUIRED |

#### `inventory.*`
| Field | Required | Type | Description |
| ----- | -------- | ---- | ----------- |
| UNRESOLVED | UNRESOLVED | UNRESOLVED | UNRESOLVED — BUSINESS DECISION REQUIRED |

## Producer Ownership
* `ProductService` owns `product.*`
* `CategoryService` owns `category.*`
* `InventoryService` owns `inventory.*`

## Consumer Ownership
* `Audit Framework` consumes all events for compliance logging.
* `Future Notification Service (Phase 6)` consumes notification-worthy events.
* `Analytics (Future)` consumes all events.

## Correlation Rules
* `inventory.reduced` MUST reuse the `correlation_id` of `payment.paid` and `order.fulfilled` when applicable.
* Trace chains: Order → Payment → Webhook → Inventory must share `correlation_id`.

## Audit Mapping

| Event | Matching Audit Action |
| ----- | --------------------- |
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
* InventoryService emitting order events.
* InventoryService emitting payment events.
* Frontend emitting domain events.
* Modifying events after publication.

## Dependencies
* docs/architecture/product/product-events.md
* docs/architecture/product/product-auditing.md

## Open Questions
UNRESOLVED — BUSINESS DECISION REQUIRED

## Completion Criteria
UNRESOLVED — BUSINESS DECISION REQUIRED
