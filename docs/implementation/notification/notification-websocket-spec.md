# Notification WebSocket Specification

## Purpose
The purpose of this document is to define the exact integration point between the Notification Domain and the WebSocket Domain. It specifies the structure of the data payloads that the Notification domain formats and sends to the Event Router for real-time broadcast to the frontend client.

## Scope
- Triggering real-time inbox count updates.
- Pushing new transient notification toasts to the client.
- The interaction between the `DeliveryProcessingService` and the Event Bus for WebSocket dispatch.

## Out of Scope
- Detailed WebSocket connection and lifecycle management (handled natively by the WebSocket Domain).
- Client-side React state management logic.

## Definitions
- **Transient Delivery**: A delivery attempt over the WebSocket channel. It relies on the client currently being connected; if they are not, the message is dropped without retrying.
- **Toast**: A brief UI pop-up on the frontend notifying the user of an event as it happens.

## Architecture

### 1. The Dispatch Flow
When the Preference Resolver determines that the `WEBSOCKET` channel should be utilized for a notification:
1. The Orchestrator creates a `DeliveryAttempt` with `channel="WEBSOCKET"`.
2. The `DeliveryProcessingService` immediately executes the dispatch task.
3. Instead of making an external HTTP request, the dispatcher maps the Notification record into a sanitized WebSocket JSON Frame.
4. The dispatcher publishes this frame to the internal Event Bus, targeting the `user.[recipient_id].notifications` channel.
5. The `DeliveryAttempt` status is immediately transitioned to `SENT`. (Because this is a fire-and-forget transient channel, there are no "Failures" to retry unless the internal Event Bus itself is down).

### 2. Payload Schemas
The Notification Domain formats the payload inside the standard WebSocket Message Contract envelope (`type: data`).

**Event: New Notification**
Sent when a new unread notification is created for the user. Provides enough context for the frontend to render a real-time toast and increment the unread badge without polling.
```json
{
  "type": "data",
  "channel": "user.9876.notifications",
  "payload": {
    "event": "notification_new",
    "data": {
      "notification_id": "uuid",
      "category": "request_update",
      "title": "Request #1024 Assigned",
      "message": "John Doe has been assigned to your request.",
      "action_link": "/requests/1024",
      "created_at": "iso8601"
    }
  }
}
```

**Event: Inbox State Change**
Sent when the state of an existing notification changes (e.g., marked as read from another device), ensuring multiple tabs stay perfectly synchronized.
```json
{
  "type": "data",
  "channel": "user.9876.notifications",
  "payload": {
    "event": "notification_state_changed",
    "data": {
      "notification_id": "uuid",
      "status": "READ",
      "updated_at": "iso8601"
    }
  }
}
```

## Responsibilities
- **Notification Dispatcher**: Must extract only the safe, public-facing fields from the `Notification` record (title, message, link) before pushing to the Event Bus.
- **Event Bus Integration**: The dispatch code must not block the Celery worker if the Event Bus (Redis) is momentarily slow.

## Dependencies
- **WebSocket Domain**: Assumes the `user.[recipient_id].notifications` channel is an established, authenticated, and securely isolated channel managed by the WebSocket services.

## Open Questions
- None. The integration follows the established pub/sub decoupling strategy.

## Completion Criteria
- The specific JSON payloads used to broadcast new notifications and state changes to connected clients are defined.
- The concept of WebSocket delivery as a fire-and-forget transient process is explicitly documented.
