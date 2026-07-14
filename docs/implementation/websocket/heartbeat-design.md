# WebSocket Heartbeat Design Implementation

## Purpose
The purpose of this document is to define the technical implementation of the Heartbeat mechanism (Ping/Pong) used to maintain connection health, detect zombie sockets, and prevent intermediate load balancers from aggressively dropping idle connections.

## Scope
- Ping/Pong frame structure.
- Server-side timeout enforcement.
- Load balancer keep-alive strategies.

## Out of Scope
- Detailed metrics gathering from heartbeats (covered in `monitoring.md`).

## Definitions
- **Zombie Socket**: A TCP connection that has dropped silently on the client side (e.g., cell network loss) without sending a FIN packet, leaving the server allocating memory for a dead connection.
- **Ping/Pong**: Control frames defined by the WebSocket RFC to verify liveness.

## Architecture

### 1. The Heartbeat Cycle
- **Client-Initiated**: The frontend client is responsible for sending a `ping` frame every 30 seconds.
- **Server Response**: The ASGI Consumer must immediately respond with a `pong` frame upon receipt.
- **Timeouts**: The server records the timestamp of the last received `ping`. If the server does not receive a `ping` for 65 seconds (allowing for network latency and one missed cycle), the server forcibly closes the TCP socket and triggers the `disconnect` cleanup logic.

### 2. Load Balancer Keep-Alive
- Intermediate proxies (like AWS ALB or Nginx) typically drop idle connections after a predefined timeout (e.g., 60 seconds).
- The 30-second heartbeat cycle ensures traffic flows across the socket frequently enough to reset the proxy idle timers, keeping the long-lived connection open.

## Responsibilities
- **Frontend**: Must reliably schedule the ping interval.
- **Consumer**: Must efficiently process pings without adding unnecessary overhead to the main event loop.

## Dependencies
- **WebSocket Protocol (RFC 6455)**: Defines the standard ping/pong control frames.

## Open Questions
- All business and technical decisions have been resolved.

## Completion Criteria
- The heartbeat interval and timeout thresholds are defined.
- The strategy for pruning zombie connections is codified.
