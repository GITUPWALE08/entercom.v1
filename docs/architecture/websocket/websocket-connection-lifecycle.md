# WebSocket Connection Lifecycle Architecture

## Purpose
The purpose of this document is to define the states, transitions, and graceful degradation mechanics of a physical WebSocket connection from the moment a client requests an upgrade to the moment the socket is permanently closed.

## Scope
- Connection setup and the HTTP-to-WebSocket upgrade handshake.
- Active connection maintenance (heartbeats, keepalives).
- Graceful termination initiated by the client or the server.
- Ungraceful termination (network drops, timeouts).

## Out of Scope
- Application-level reconnection strategies (handled in `websocket-reconnection.md`).
- Specific ASGI server internal loop mechanics.
- Client-side browser networking stack behavior.

## Definitions
- **Upgrade Handshake**: The initial HTTP request where the client asks the server to switch protocols from HTTP/1.1 to WebSocket.
- **Heartbeat (Ping/Pong)**: Small control frames sent periodically to verify that the TCP connection is still alive and data can flow in both directions.
- **Graceful Close**: A planned termination where a `Close` control frame is exchanged, allowing both parties to clean up resources.
- **Zombie Connection**: A TCP socket that appears open to the server, but the client on the other end is actually gone (e.g., due to cellular dead zones).

## Architecture

### Lifecycle States
A WebSocket connection within the ASGI environment moves through the following strict states:

1. **Connecting (Handshake phase)**
   - The Connection Management Service evaluates the incoming HTTP request.
   - Authentication and Origin validation occur.
   - *Outcome*: 
     - Success -> Transition to `Connected`.
     - Failure -> Reject with HTTP 403 Forbidden. Socket closed immediately.

2. **Connected (Active phase)**
   - The HTTP `101 Switching Protocols` response is sent.
   - The Presence Management Service emits a `UserOnline` event.
   - The connection sits idle, multiplexing client `SUBSCRIBE` commands and server outbound broadcasts.
   - The server enforces a strict Heartbeat protocol to ensure the connection is truly alive.

3. **Closing (Termination phase)**
   - Initiated by either the client (e.g., closing the browser tab) or the server (e.g., forcing a logout).
   - A standard WebSocket `Close` frame is transmitted containing a status code and an optional reason string.
   - The ASGI server unwinds all Backplane topic bindings associated with the connection to prevent memory leaks.
   - The Presence Management Service emits a `UserOffline` event.

4. **Closed (Terminal phase)**
   - The underlying TCP socket is destroyed by the operating system.

### Zombie Connection Mitigation
To prevent memory leaks and inaccurate Presence data on the backend, the system must aggressively prune Zombie Connections.
- The ASGI server configures a bi-directional Ping/Pong interval (e.g., 30 seconds).
- If the server sends a Ping and does not receive a Pong within a defined timeout (e.g., 10 seconds), the server assumes the client has silently dropped off the network.
- The server forcefully transitions the state to `Closing`, unbinds all subscriptions, and destroys the socket.

## Responsibilities
- **Connection Management Service**: Actively enforce the Ping/Pong intervals and rapidly detect dead connections.
- **Subscription Management Service**: Ensure 100% of Redis Backplane subscriptions are explicitly detached when a connection enters the `Closing` state, regardless of whether the close was graceful or ungraceful.

## Dependencies
- **ASGI Server (Daphne/Uvicorn)**: Relies on the low-level server implementation to handle the physical transmission of Ping/Pong control frames.

## Open Questions
All business and technical decisions have been resolved:

**Decision:** Maximum connection lifetime:
24 hours

Server requests graceful reconnect.

## Completion Criteria
- The transition from HTTP handshake to active connection is clearly mapped.
- The mechanics for detecting and destroying Zombie Connections via Heartbeats are established.
- The cleanup responsibilities during termination are codified.
