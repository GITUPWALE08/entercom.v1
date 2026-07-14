# WebSocket Scaling Architecture

## Purpose
The purpose of this document is to define the horizontal scaling strategy for the WebSocket domain. WebSockets maintain persistent, stateful TCP connections, presenting unique challenges compared to stateless HTTP APIs. This architecture ensures the system can seamlessly scale to accommodate an ever-growing pool of concurrently connected users.

## Scope
- ASGI node horizontal scaling.
- Redis Backplane scaling.
- Connection distribution and load balancing.

## Out of Scope
- Auto-scaling metric configurations (e.g., specific CPU threshold percentages).
- Database connection pooling scaling (since WebSockets should ideally minimize direct DB hits).

## Definitions
- **Horizontal Scaling (Scale Out)**: Adding more ASGI server instances (nodes) to distribute the pool of active WebSocket connections.
- **Connection Density**: The maximum number of concurrent, active WebSocket connections a single ASGI node can safely maintain before latency degrades.
- **Fan-Out**: The process of taking a single event (e.g., a Global Broadcast) and replicating it across multiple ASGI nodes and ultimately thousands of individual client sockets.

## Architecture

### Node Layer Scaling
The WebSocket domain is designed to be horizontally scaled by adding more generic ASGI worker processes.
1. **Stateless Nodes**: While the TCP connection itself holds state, the ASGI node *business logic* must remain strictly stateless. An ASGI node must not store connection states in local memory (like Python dictionaries) that other nodes need to read.
2. **Load Balancing**: The external load balancer (e.g., AWS ALB, Nginx) must distribute incoming WebSocket upgrade requests across all available ASGI nodes. 
3. **No Sticky Sessions**: Because the Redis Backplane synchronizes all messages globally, the load balancer does NOT require "sticky sessions" (session affinity). A client can reconnect to any available node and still receive their data via the Redis pub/sub mechanism.

### Backplane Scaling (Redis)
Redis serves as the central nervous system for routing events between nodes.
1. **Pub/Sub Throughput**: The Event Router publishes a payload once to Redis. Redis rapidly duplicates and pushes the message to all ASGI nodes subscribed to that specific topic.
2. **Dedicated Instance**: Because WebSockets generate continuous, high-volume pub/sub traffic, the Redis instance used for the `CHANNEL_LAYERS` backplane MUST be isolated from the Redis instance used for application caching or Celery task queues. This prevents a burst of WebSocket broadcasts from starving the core application cache.

### The Fan-Out Challenge
When a Global Broadcast is sent (e.g., `system.maintenance`), every single ASGI node must broadcast the message to thousands of local sockets simultaneously.
- To prevent CPU spikes on the ASGI nodes, global broadcasts should be used sparingly.
- The Event Router must serialize the JSON payload *once* before pushing to Redis, rather than forcing each ASGI node to repeatedly serialize the same Python dict into JSON for every individual connected socket.

## Responsibilities
- **DevOps / Infrastructure**: Must configure the load balancer with appropriate idle timeout settings (WebSockets require longer idle timeouts than standard HTTP requests to support ping/pong heartbeats).
- **Application Logic**: Ensure all cross-node communication strictly utilizes the Redis Backplane.

## Dependencies
- **Load Balancer**: A layer 7 load balancer capable of supporting the HTTP/1.1 Upgrade header and long-lived connections.
- **Dedicated Redis Cluster**: Required for the `CHANNEL_LAYERS` backplane.

## Open Questions
All business and technical decisions have been resolved:

**Decision:** Target:
5,000 concurrent connections per ASGI node.

**Decision:** Multi-region WebSocket backplane is out of scope for Phase 6.

Single-region Redis pub/sub.

## Completion Criteria
- The strategy for distributing connections across stateless ASGI nodes is defined.
- The requirement for a dedicated Redis backplane, separated from the caching layer, is explicitly mandated.
- Load balancer requirements (no sticky sessions, long timeouts) are established.
