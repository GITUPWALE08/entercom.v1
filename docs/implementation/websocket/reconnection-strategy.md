# WebSocket Reconnection Strategy Implementation

## Purpose
The purpose of this document is to define the technical implementation of the client-side reconnection logic and server-side advisory commands, ensuring the system can recover gracefully from network drops and planned deployments without suffering a thundering herd failure.

## Scope
- Client-side Exponential Backoff algorithms.
- Server-side Deployment Advisory frames.
- Connection state reconciliation.

## Out of Scope
- Internal Redis reconnection logic (managed by Django Channels).

## Definitions
- **Thundering Herd**: A catastrophic failure mode where thousands of disconnected clients attempt to reconnect to the server at the exact same millisecond, overwhelming the authentication middleware and database.

## Architecture

### 1. Exponential Backoff
As per the resolved business decision, the client must implement a strict exponential backoff schedule upon unintended disconnection.
- **Schedule**: 1s, 2s, 4s, 8s, 16s, capped at a maximum delay of 30 seconds.
- **Jitter**: The client must apply +/- 20% randomized jitter to the calculated delay to ensure clients that dropped simultaneously do not reconnect simultaneously.

### 2. Planned Deployments (Advisory Reconnect)
When the engineering team performs a rolling deployment, the ASGI pods will be gracefully terminated.
- **Advisory Frame**: Before shutting down, the server sends a custom `system_reconnect_advisory` frame to all connected clients.
- **Randomized Window**: As per the resolved business decision, upon receiving this frame, clients must silently close their socket and schedule a reconnection at a random interval between 1 and 10 seconds. This spreads the reconnection load smoothly across the newly provisioned pods.

### 3. State Reconciliation
When a client successfully reconnects, it may have missed messages broadcast during its downtime.
- WebSockets are treated as a transient transport.
- Upon reconnection, the client MUST perform a standard REST API fetch to reconcile its local state (e.g., fetching the latest `/api/v1/notifications/`) to ensure no data was lost during the outage.

## Responsibilities
- **Frontend Client**: Bears the primary responsibility for executing the backoff math and state reconciliation.
- **Server Shutdown Hook**: Must be configured to broadcast the advisory frame when receiving a `SIGTERM` from the orchestration layer (e.g., Kubernetes).

## Dependencies
- **Client Libraries**: Reconnection logic is typically implemented in the frontend WebSocket wrapper.

## Open Questions
- All business and technical decisions have been resolved.

## Completion Criteria
- The exact backoff schedule (1s to 30s max) is codified.
- The Deployment Advisory workflow is defined to prevent deployment-induced thundering herds.
