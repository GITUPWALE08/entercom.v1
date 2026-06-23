# Order Event Contracts Design

## Purpose
To define the immutable, canonical event contracts for the Order Domain in Phase 5.

## Scope
* Order events

## Out of Scope
* Event publisher implementation
* Consumer implementation
* Celery task definitions
* WebSocket logic

## Event Inventory

| Event | Producer | Consumers |
| ----- | -------- | --------- |
| `order.created` | OrderService | Audit Framework, Analytics (Future) |
| `order.cancelled` | OrderService | Audit Framework, Analytics (Future) |
| `order.fulfilled` | OrderService | Audit Framework, Future Notification Service (Phase 6), Analytics (Future) |

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

#### `order.*`
| Field | Required | Type | Description |
| ----- | -------- | ---- | ----------- |
| UNRESOLVED | UNRESOLVED | UNRESOLVED | UNRESOLVED — BUSINESS DECISION REQUIRED |

## Producer Ownership
* `OrderService` owns `order.*`

## Consumer Ownership
* `Audit Framework` consumes all events for compliance logging.
* `Future Notification Service (Phase 6)` consumes notification-worthy events.
* `Analytics (Future)` consumes all events.

## Correlation Rules
* Trace chains: Order → Payment → Webhook → Inventory must share `correlation_id`.

## Audit Mapping

| Event | Matching Audit Action |
| ----- | --------------------- |
| `order.created` | `order.created` |
| `order.cancelled` | `order.cancelled` |
| `order.fulfilled` | `order.fulfilled` |

## Forbidden Behaviors
* OrderService emitting payment events.
* Frontend emitting domain events.
* Modifying events after publication.

## Dependencies
* docs/architecture/order/order-events.md
* docs/architecture/order/order-auditing.md

## Open Questions
UNRESOLVED — BUSINESS DECISION REQUIRED

## Completion Criteria
UNRESOLVED — BUSINESS DECISION REQUIRED
