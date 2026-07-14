# WebSocket Monitoring Architecture

## Purpose
The purpose of this document is to define the observability, logging, and health-checking strategies for the WebSocket Domain. Because real-time connections do not follow the standard HTTP request/response lifecycle, traditional REST monitoring metrics (like HTTP 200 rates or request duration) are insufficient. This architecture ensures system operators have absolute visibility into the health of the persistent connection pool.

## Scope
- Key Performance Indicators (KPIs) for the ASGI cluster.
- Backplane (Redis) health and throughput monitoring.
- Tracing events from the core domain through the WebSocket out to the client.
- Liveness and readiness probes for load balancing.

## Out of Scope
- Specific APM vendor selection (e.g., Datadog vs New Relic).
- Monitoring of the frontend client device (e.g., memory usage on the user's phone).

## Definitions
- **Connection Density**: The number of active WebSocket connections currently maintained by a single ASGI node.
- **Broadcast Latency**: The time elapsed between the Event Router receiving an event from the core domain and the corresponding frame being written to the client's TCP socket.
- **Churn Rate**: The velocity at which connections are being opened and closed over a given time window.

## Architecture

### ASGI Cluster Metrics
Because the ASGI nodes manage the physical sockets, they must expose specialized metrics to the APM (Application Performance Monitoring) tool:
1. **Active Connections**: A real-time gauge of open sockets per node. This is the primary metric used to trigger auto-scaling (e.g., scale out if average density exceeds 80% capacity).
2. **Churn Rate**: A high churn rate combined with a stable active connection count indicates a potential network issue causing clients to rapidly drop and reconnect (thundering herd).
3. **Dropped Messages**: A counter of outbound frames that failed to write to the socket because the connection was ungracefully dropped mid-transmission.

### Backplane (Redis) Metrics
The Redis instance acting as the `CHANNEL_LAYERS` backplane is the most critical chokepoint in the architecture.
1. **Pub/Sub Message Rate**: The number of messages published per second. Massive spikes indicate a global broadcast or a runaway process.
2. **Memory Utilization**: Monitoring for memory leaks if topic bindings are not properly cleaned up by the Subscription Management Service upon connection termination.

### Distributed Tracing
A business event (e.g., a Quote Approval) starts in a standard HTTP worker, travels through the event bus to the Event Router, through Redis, and out an ASGI socket.
- **Correlation IDs**: Every outbound WebSocket frame MUST carry the `request_id` or `trace_id` that originated the event.
- If a user reports missing a real-time update, operators must be able to search the APM using the core `request_id` and definitively trace it to the exact ASGI node and socket delivery attempt.

### Health Probes
The load balancer requires distinct endpoints to route traffic safely.
- **Liveness Probe**: A lightweight HTTP endpoint on the ASGI server (e.g., `/ws/health/live`) that returns 200 OK simply proving the Python process is not deadlocked.
- **Readiness Probe**: An endpoint (e.g., `/ws/health/ready`) that verifies the ASGI node can successfully ping the Redis Backplane. If Redis is unreachable, the node must return a 503, instructing the load balancer to stop sending new connection upgrades to this node.

## Responsibilities
- **DevOps/SRE**: Configure dashboards and alerts based on Connection Density and Churn Rate.
- **Event Router**: Inject Correlation IDs into all WebSocket payloads.

## Dependencies
- **APM Integration**: The Python application must be instrumented with the necessary libraries to emit custom gauges and counters asynchronously without blocking the ASGI event loop.

## Open Questions
All business and technical decisions have been resolved:

**Decision:** Alert threshold:
Broadcast latency >250ms for 5 consecutive minutes.

**Decision:** Capture per-channel subscription metrics.

## Completion Criteria
- The necessity for WebSocket-specific metrics (density, churn) vs standard HTTP metrics is codified.
- The requirement for end-to-end distributed tracing via Correlation IDs is established.
- The distinction between liveness (process health) and readiness (backplane health) is defined.
