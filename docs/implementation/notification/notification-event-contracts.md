# Notification Event Contracts

## Purpose
The purpose of this document is to define the specific payload schemas for the events that the Notification Domain produces and consumes. It establishes the internal API for decoupled, asynchronous communication between the Notification Domain and the rest of the platform.

## Scope
- Schema for inbound business events (triggering a notification).
- Schema for outbound state events (broadcasting notification updates).
- Routing keys and topic naming conventions.

## Out of Scope
- Specific message broker technologies (e.g., RabbitMQ vs Redis Streams) beyond the concept of "topics".
- WebSocket frame serialization (handled in `notification-websocket-spec.md`).

## Definitions
- **Producer**: The domain that generates and publishes the event.
- **Consumer**: The domain that listens for and acts upon the event.
- **Payload Schema**: The expected JSON structure of the event message.

## Architecture

### 1. Inbound Event Contract (Triggering a Notification)
Core domains MUST NOT call the Notification Service synchronously. Instead, they publish standardized domain events. The Notification Orchestrator acts as the consumer.

**Routing Key / Topic**: `domain.[domain_name].event.[event_name]` (e.g., `domain.requests.event.status_changed`)

**Schema**:
```json
{
  "event_id": "uuid",
  "timestamp": "iso8601",
  "producer": "requests",
  "type": "status_changed",
  "data": {
    "resource_type": "request",
    "resource_id": "1024",
    "actor_id": "uuid (the user who made the change, to prevent notifying them of their own action)",
    "target_recipient_ids": ["uuid", "uuid"],
    "context": {
      "old_status": "pending",
      "new_status": "assigned",
      "assigned_to_name": "John Doe"
    }
  }
}
```
*Implementation Note*: The Orchestrator maps the `type` and `producer` to a specific notification template. The `context` block provides the raw variables needed to render that template (e.g., "Request #1024 has been assigned to John Doe").

### 2. Outbound State Event Contract (Broadcasting Updates)
When the state of a notification changes, the Notification Domain publishes an event so other domains (like WebSockets or Auditing) can react.

**Routing Key / Topic**: `domain.notifications.event.[state_change]` (e.g., `domain.notifications.event.created`, `domain.notifications.event.read`)

**Schema**:
```json
{
  "event_id": "uuid",
  "timestamp": "iso8601",
  "producer": "notifications",
  "type": "notification_read",
  "data": {
    "notification_id": "uuid",
    "recipient_id": "uuid",
    "resource_type": "request",
    "resource_id": "1024",
    "channel_states": {
      "IN_APP": "READ",
      "EMAIL": "SENT"
    }
  }
}
```
*Implementation Note*: The WebSocket domain consumes this event, extracts the `recipient_id`, and pushes a real-time frame to that specific user's `user.[id].notifications` channel to decrement their unread badge count.

### 3. Outbound Audit Event Contract (Logging Failures)
For security and troubleshooting, permanent failures and administrative actions are published to the Audit Domain.

**Routing Key / Topic**: `domain.notifications.audit.[action]` (e.g., `domain.notifications.audit.delivery_failed`)

**Schema**:
```json
{
  "event_id": "uuid",
  "timestamp": "iso8601",
  "producer": "notifications",
  "type": "delivery_dead_lettered",
  "data": {
    "delivery_attempt_id": "uuid",
    "notification_id": "uuid",
    "channel": "EMAIL",
    "error_metadata": {
      "code": 400,
      "message": "Hard bounce: invalid recipient"
    }
  }
}
```

## Responsibilities
- **Core Domains**: Must adhere strictly to the inbound schema, ensuring all necessary template context variables are provided.
- **Notification Domain**: Must validate incoming payloads and gracefully discard malformed events without crashing the consumer worker.

## Dependencies
- **Event Bus / Message Broker**: An infrastructure layer capable of publish/subscribe routing based on topic keys.

## Open Questions
- None. Schema definitions provide the necessary specificity for implementation.

## Completion Criteria
- The strict JSON schemas for triggering a notification are defined.
- The outbound schemas for state changes and audit logging are defined.
- Topic routing conventions are established.
