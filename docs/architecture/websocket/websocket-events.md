# WebSocket Events Architecture

## Purpose
The purpose of this document is to define the event contracts that govern the flow of data into and out of the WebSocket domain. It establishes how business events are translated into real-time broadcasts and how client-side lifecycle events are published to the rest of the system.

## Scope
- Inbound events consumed by the WebSocket Domain (e.g., from the Notification or Request domains).
- Outbound events produced by the WebSocket Domain (e.g., user connected/disconnected).
- Payload structure mapping from internal business events to public WebSocket frames.

## Out of Scope
- Specific JSON string formatting algorithms.
- Inter-node Redis pub/sub internal message structures (only the logical event contracts are covered here).

## Definitions
- **Inbound Event**: A system event (e.g., `NotificationCreated`) published by a core domain that the Event Routing Service intercepts and broadcasts over active WebSockets.
- **Outbound Event**: An event published by the Presence Management Service (e.g., `UserOnline`, `UserOffline`) to inform the rest of the platform of a user's real-time status.
- **WebSocket Frame**: The final, sanitized JSON payload physically transmitted over the TCP connection to the client.

## Architecture

### Inbound Flow (Server to Client)
The WebSocket domain is a passive consumer of system events.
1. A core domain (e.g., Requests) publishes an event: `RequestUpdated(request_id="123", status="assigned")`.
2. The Event Routing Service intercepts this event and determines the target channel: `channel="request.123.updates"`.
3. The service maps the rich internal event payload into a sanitized, lightweight WebSocket Frame.
4. The service publishes the frame to the Backplane, which routes it to all ASGI nodes currently holding connections subscribed to `request.123.updates`.

### Outbound Flow (Client to Server)
The WebSocket domain publishes events regarding client connectivity.
1. A user establishes a connection. The Connection Management Service authenticates the user.
2. The Presence Management Service publishes an internal system event: `UserOnline(user_id="456")`.
3. Core domains (e.g., Chat or Assignments) can subscribe to this event to update UI indicators (e.g., showing a green dot next to the user's avatar) or trigger specific logic (e.g., assigning a ticket only to online staff).
4. Upon disconnect (graceful or timeout), a `UserOffline(user_id="456")` event is published.

## Responsibilities
- **Event Routing Service**: Must strictly sanitize inbound event payloads. Internal system data, database IDs, or sensitive PII not meant for the client UI must be stripped before the WebSocket Frame is broadcast.
- **Presence Management Service**: Must employ debouncing or delay mechanics before publishing `UserOffline` to prevent "flickering" during transient network drops (e.g., mobile devices switching from WiFi to Cellular).

## Dependencies
- **Core Domains (Requests, Notifications, etc.)**: As producers of the business events.
- **Event Bus**: For internal publish/subscribe routing between the core domains and the WebSocket domain.

## Open Questions
All business and technical decisions have been resolved:

**Decision:** Client-originated WebSocket messages must pass through the appropriate business domain.

Never route client messages directly between clients.

## Completion Criteria
- The flow of inbound business events translating into outbound WebSocket frames is defined.
- The flow of connection lifecycle events translating into internal Presence events is defined.
- The requirement for strict payload sanitization is codified.
