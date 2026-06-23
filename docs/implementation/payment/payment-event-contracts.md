# Payment Event Contracts Design

## Purpose
To define the immutable, canonical event contracts for the Payment Domain in Phase 5.

## Scope
* Payment events
* Webhook events

## Out of Scope
* Event publisher implementation
* Consumer implementation
* Celery task definitions
* WebSocket logic

## Event Inventory

| Event | Producer | Consumers |
| ----- | -------- | --------- |
| `payment.initialized` | PaymentService | Audit Framework, Analytics (Future) |
| `payment.paid` | WebhookService | OrderService, Audit Framework, Analytics (Future) |
| `payment.failed` | WebhookService | Audit Framework, Analytics (Future) |
| `payment.cancelled` | PaymentService | Audit Framework, Analytics (Future) |
| `payment.expired` | Payment Expiry Background Job | Audit Framework, Analytics (Future) |
| `webhook.received` | WebhookService | Audit Framework |
| `webhook.rejected` | WebhookService | Audit Framework |

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

#### `payment.*` and `webhook.*`
| Field | Required | Type | Description |
| ----- | -------- | ---- | ----------- |
| UNRESOLVED | UNRESOLVED | UNRESOLVED | UNRESOLVED — BUSINESS DECISION REQUIRED |

## Producer Ownership
* `PaymentService` owns `payment.initialized` and `payment.cancelled`.
* `Payment Expiry Background Job` owns `payment.expired`.
* `WebhookService` owns `payment.paid`, `payment.failed`, `webhook.received`, and `webhook.rejected`.

## Consumer Ownership
* `OrderService` consumes `payment.paid`.
* `Audit Framework` consumes all events for compliance logging.
* `Analytics (Future)` consumes all events.

## Correlation Rules
* Trace chains: Order → Payment → Webhook → Inventory must share `correlation_id`.
* `inventory.reduced` MUST reuse the `correlation_id` of `payment.paid` when applicable.

## Audit Mapping

| Event | Matching Audit Action |
| ----- | --------------------- |
| `payment.initialized` | `payment.initialized` |
| `payment.paid` | `payment.paid` |
| `payment.failed` | `payment.failed` |
| `payment.cancelled` | `payment.cancelled` |
| `payment.expired` | `payment.expired` |
| `webhook.received` | `webhook.received` |
| `webhook.rejected` | `webhook.rejected` |

## Forbidden Behaviors
* PaymentService emitting inventory events.
* Webhook endpoint bypassing event publication.
* Frontend emitting domain events.
* Modifying events after publication.

## Dependencies
* docs/architecture/payment/payment-events.md
* docs/architecture/payment/payment-auditing.md

## Open Questions
UNRESOLVED — BUSINESS DECISION REQUIRED

## Completion Criteria
UNRESOLVED — BUSINESS DECISION REQUIRED
