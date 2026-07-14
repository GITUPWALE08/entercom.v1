# WebSocket Domain Architecture

## Purpose
The purpose of this document is to define the core concepts, boundaries, and vocabulary (Ubiquitous Language) for the WebSocket domain within the Entercom platform (Phase 6). It establishes the foundational principles for managing persistent, real-time bidirectional connections between the frontend clients and the backend system.

## Scope
- Definition of WebSocket connections, channels, and multiplexing.
- The role of the WebSocket domain as a real-time transport layer.
- Integration boundaries with other business domains (Notifications, Requests, Quotes, Payments).
- Connection lifecycle management concepts.

## Out of Scope
- Detailed ASGI server configurations (e.g., Daphne internals).
- Low-level network tuning (e.g., TCP keepalives).
- Real-time chat (explicitly excluded from Phase 6).

## Definitions
- **WebSocket Connection**: A persistent, bidirectional, full-duplex TCP connection established between a client and the server.
- **Multiplexing**: The practice of routing multiple distinct logical data streams (Channels) over a single physical WebSocket Connection.
- **Channel**: A logical pathway or topic that a client subscribes to (e.g., `user.notifications`, `request.123.updates`).
- **Presence**: The ability to track and broadcast the online/offline status of a user in real-time.
- **Message Broker**: The internal infrastructure (e.g., Redis Pub/Sub) used to route messages between different backend worker nodes and the active WebSocket connections.

## Architecture
The WebSocket Domain acts as a horizontal infrastructure layer, similar to the Notification Domain. It does not own core business logic (like deciding if a Quote is approved). Instead, it provides the "pipes" through which other domains can push state changes to active users instantly.

1. **Connection Gateway**: The entry point that accepts, upgrades, and maintains the raw HTTP-to-WebSocket connection.
2. **Subscription Manager**: Handles client requests to subscribe to or unsubscribe from specific Channels.
3. **Event Router**: Listens to the internal Message Broker and routes incoming business events to the active connections subscribed to the relevant Channels.

## Responsibilities
- **Transport Reliability**: Maintain stable connections and handle ungraceful disconnects seamlessly.
- **State Broadcast**: Enable domains (Notifications, Requests, Quotes, Assignments, Payments) to push real-time updates to connected clients.
- **Resource Efficiency**: Maximize connection density per server node using asynchronous I/O and multiplexing.
- **Security**: Ensure connections are strictly authenticated and that clients can only subscribe to Channels they are authorized to view.

## Dependencies
- **Authentication Domain**: To validate JWTs during the initial HTTP upgrade handshake.
- **Message Broker (Redis)**: To facilitate inter-process communication, allowing a business event generated on Worker Node A to reach a WebSocket connection held by ASGI Node B.

## Open Questions
All business and technical decisions have been resolved:

**Decision:** Maximum end-to-end event latency:
250 milliseconds

**Decision:** Authenticated WebSockets only.

Anonymous connections are not supported.

## Completion Criteria
- The WebSocket Domain's role strictly as a transport/infrastructure layer is clearly defined.
- Core terminology (Connections, Channels, Multiplexing) is established.
- The boundary between business logic and real-time transport is explicitly separated.
