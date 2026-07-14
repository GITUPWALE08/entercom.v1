# WebSocket Reconnection Architecture

## Purpose
The purpose of this document is to define the client-side and server-side strategies for recovering from ungraceful WebSocket disconnections. Because real-time connections traverse volatile networks (cellular dropouts, proxy timeouts), the system must elegantly restore the connection and synchronize any missed state without overwhelming the backend.

## Scope
- Client-side automatic reconnection logic (Exponential Backoff with Jitter).
- Server-side connection draining and rejection handling.
- State synchronization (State Reconciliation) upon successful reconnection.

## Out of Scope
- Implementation of offline support (e.g., caching mutations while disconnected).
- Client-side UI design for the "Offline/Reconnecting" banner.

## Definitions
- **Exponential Backoff**: A standard network error-handling strategy that progressively increases the waiting time between retries up to a maximum limit.
- **Jitter**: A randomized variation added to the backoff delay to prevent a "thundering herd" scenario where thousands of clients reconnect at the exact same millisecond.
- **State Reconciliation**: The process of fetching the latest canonical data via REST API immediately after a WebSocket reconnection to ensure no real-time events were missed during the downtime.

## Architecture

### Client-Side Reconnection Strategy
The frontend WebSocket client MUST NOT continuously spam the server attempting to reconnect upon a failure. 
1. **Initial Drop**: The client detects the connection has dropped (either via a `Close` frame or a timeout).
2. **Backoff Schedule**: The client schedules a reconnection attempt using an exponential backoff formula. For example: `min(max_delay, base * (2^attempt)) + jitter`.
   - Attempt 1: ~1 second
   - Attempt 2: ~2 seconds
   - Attempt 3: ~4 seconds
   - Attempt 4: ~8 seconds
3. **Max Delay**: The backoff must cap at a maximum reasonable delay (e.g., 30 seconds) to ensure the client eventually recovers without waiting for hours.

### Server-Side Load Protection
During a major network event (e.g., an AWS load balancer restarts), thousands of clients will attempt to reconnect simultaneously.
- **Connection Queuing**: The ASGI server must be configured with appropriate connection queues to handle the burst.
- **Backpressure / 503s**: If the ASGI cluster is overwhelmed, it should reject the WebSocket upgrade handshake with an HTTP `503 Service Unavailable`. The client's backoff strategy will naturally absorb this rejection and retry later.

### State Reconciliation (Missed Events)
Because the WebSocket Domain operates on an "at-most-once" delivery guarantee, any business events fired while a client was disconnected are permanently missed by that specific client instance.
1. **The Gap**: The client drops offline at 10:00:00. A request is assigned to them at 10:00:05. The client reconnects at 10:00:10.
2. **Reconciliation Trigger**: Upon successfully re-establishing the WebSocket connection and completing the `SUBSCRIBE` commands, the frontend client MUST immediately fire a REST API request to fetch the latest state of the data it is currently viewing.
3. **Resolution**: The REST API returns the updated Request state (assigned), ensuring the UI is perfectly synchronized despite missing the transient WebSocket broadcast.

## Responsibilities
- **Frontend Client Library**: Fully encapsulate the backoff math, the jitter randomization, and the trigger for the REST reconciliation fetch so UI components do not have to handle reconnection logic manually.
- **Backend ASGI Infrastructure**: Implement aggressive rate limiting on the `/ws/` endpoint at the load-balancer/gateway level to protect the Python processes from thundering herds.

## Dependencies
- **Core Domain REST APIs**: State Reconciliation relies heavily on the core REST APIs being fast and available to handle the burst of read requests following a mass reconnection event.

## Open Questions
All business and technical decisions have been resolved:

**Decision:** Exponential backoff:

1s
2s
4s
8s
16s
30s (maximum)

**Decision:** During planned deployments the server broadcasts a reconnect advisory frame.

Clients randomize reconnect between 1–10 seconds.

## Completion Criteria
- The requirement for Exponential Backoff with Jitter is explicitly mandated.
- The State Reconciliation pattern (REST fallback) is defined to guarantee data integrity across disconnections.
