# WebSocket Services Architecture

## Purpose
The purpose of this document is to define the logical services that make up the WebSocket domain, detailing their responsibilities, boundaries, and how they interact to maintain real-time connections and route state updates.

## Scope
- Connection Management Service.
- Subscription and Multiplexing Service.
- Event Routing Service.
- Presence Management Service.

## Out of Scope
- Code-level consumer class design.
- The specific implementation of the Redis pub/sub layer.

## Definitions
- **ASGI**: Asynchronous Server Gateway Interface, the standard for Python asynchronous web apps.
- **Node**: A single instance of the ASGI server process handling a subset of the global WebSocket connections.
- **Backplane**: The shared message broker (Redis) that allows all Nodes to communicate and broadcast to connections they do not locally own.

## Architecture
The WebSocket Domain operates as a distributed system, relying on an in-memory backplane to synchronize state across multiple ASGI nodes.

1. **Connection Management Service**: The front-door service running on every ASGI node. It intercepts the HTTP upgrade request, interfaces with the Authentication Domain to validate the user, and establishes the persistent TCP connection. It monitors connection health (heartbeats).
2. **Subscription & Multiplexing Service**: Once connected, a single physical connection can handle multiple logical channels. This service listens for client-sent control messages (e.g., `SUBSCRIBE request.123`) and binds the connection to the appropriate topics on the Backplane.
3. **Event Routing Service**: Acts as the bridge between core business domains and the WebSocket backplane. When a domain (e.g., Notifications) fires an event, this service translates the business event into a WebSocket payload and publishes it to the specific topic on the Backplane.
4. **Presence Management Service**: A specialized service that monitors the connect/disconnect events from the Connection Management Service to maintain a globally accurate ledger of which users are currently online.

## Responsibilities
- **Connection Manager**: Safely accept and terminate connections. Enforce max connection timeouts and rate limits.
- **Subscription Manager**: Ensure clients only subscribe to channels they are authorized to access.
- **Event Router**: Format payloads efficiently (minimal data size) and ensure high-throughput publishing to the Backplane.
- **Presence Manager**: Handle edge cases like "ghost connections" (where a client drops without sending a disconnect frame) using timeouts or heartbeats.

## Dependencies
- **Authentication Domain**: Connection Management Service requires rapid JWT validation during the handshake.
- **Authorization/Roles Domain**: Subscription Management requires fast verification of user access to requested channels.
- **Message Broker (Redis)**: The foundational Backplane required by the Event Routing and Presence Management services.

## Open Questions
All business and technical decisions have been resolved:

**Decision:** Subscription Management Service continuously validates authorization.

Permission revocation immediately removes subscriptions.

**Decision:** Event Routing Service uses Redis Pub/Sub only.

Sticky routing is unnecessary.

## Completion Criteria
- The logical separation between accepting connections, managing subscriptions, routing events, and tracking presence is established.
- The reliance on a distributed Backplane (Redis) for cross-node communication is clearly documented.
