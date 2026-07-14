# WebSocket Connection Manager Implementation Design

## Purpose
The purpose of this document is to define the technical implementation details for the Connection Management Service within the WebSocket domain. It bridges the gap between the architectural requirements (such as lifecycle management and zombie connection pruning) and the practical execution using Django Channels and Daphne.

## Scope
- Implementation pattern for accepting and rejecting WebSocket handshakes.
- Defining the core ASGI application routing.
- Injecting context (e.g., User ID, Roles) into the connection scope.
- Enforcing concurrency limits and origin validation.

## Out of Scope
- Detailed channel subscription multiplexing (handled in `subscription-management.md`).
- JWT validation mechanics (delegated to `authentication-flow.md`).
- Raw Redis pub/sub configurations (handled in `redis-pubsub-design.md`).

## Definitions
- **Django Channels**: The official Django library that extends the framework to handle WebSockets and asynchronous protocols.
- **Consumer**: The Django Channels equivalent of a View; it handles the events of a specific WebSocket connection (connect, receive, disconnect).
- **Scope**: A dictionary containing connection details (headers, query strings, user data) that persists for the lifetime of the socket.

## Architecture

### 1. ASGI Routing
The `Connection Manager` is practically implemented as the root ASGI application router in Django Channels.
- **`asgi.py`**: Must define the `ProtocolTypeRouter`.
- **WebSocket Protocol**: Must route through the `AllowedHostsOriginValidator` to prevent Cross-Site WebSocket Hijacking (CSWSH) before reaching the custom Authentication middleware.
- **Consumer Binding**: All valid WebSocket traffic (e.g., `ws/`) is routed to a central `MainMultiplexerConsumer` (or a similar singleton consumer) that maintains the physical connection.

### 2. Handshake Interception
Before the HTTP connection is upgraded to a WebSocket, the Connection Manager must intercept the request.
- The custom Authentication Middleware intercepts the `Scope`.
- It parses the query string for the JWT token.
- If invalid or missing, the middleware immediately closes the connection, preventing the consumer's `connect()` method from even executing.

### 3. The Core Consumer Lifecycle
The central Consumer acts as the persistent manager for the physical socket.
- **`connect()`**: 
  - Verifies the user is authenticated (via the modified Scope).
  - Enforces concurrency limits by checking the global Presence ledger (Redis). If the user has exceeded their max device count, the oldest connection must be forcefully closed or this new connection rejected.
  - Calls `self.accept()` to send the HTTP `101 Switching Protocols` response.
  - Registers the connection with the `Presence Management Service`.
- **`disconnect(close_code)`**:
  - Deregisters the connection from the `Presence Management Service`.
  - Initiates cleanup of all active Backplane subscriptions (delegated to the Subscription Manager).

### 4. Connection Concurrency Limits
To prevent DoS attacks via connection exhaustion:
- The `connect()` method must check a Redis counter keyed by `user_id`.
- If the counter exceeds the maximum allowed concurrent connections (e.g., 5), the system should aggressively disconnect the oldest active session. This requires the `Connection Manager` to maintain a registry of active channel names per `user_id` so it can issue a targeted disconnect command across the backplane.

## Responsibilities
- **Connection Refusal**: The Manager must ensure that unauthorized traffic is rejected as early as possible in the ASGI lifecycle to minimize CPU overhead.
- **Graceful Teardown**: It must guarantee that the `disconnect` method reliably cleans up Redis bindings, even during ungraceful TCP drops.

## Dependencies
- **Django Channels**: The foundational library for ASGI routing and consumer management.
- **Authentication Middleware**: Pluggable middleware required to populate the connection Scope.

## Open Questions
- None. The implementation explicitly fulfills the connection lifecycle and security architectures.

## Completion Criteria
- The ASGI routing hierarchy (Origin Validation -> Auth Middleware -> Consumer) is defined.
- The `connect` and `disconnect` lifecycle methods are documented with their specific responsibilities.
- The strategy for enforcing concurrent connection limits is established.
