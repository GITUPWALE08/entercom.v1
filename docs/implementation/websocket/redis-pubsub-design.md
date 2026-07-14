# WebSocket Redis Pub/Sub Design Implementation

## Purpose
The purpose of this document is to define the technical configuration of the Redis layer acting as the Channel Layer Backplane. It details how messages are multiplexed across distributed nodes.

## Scope
- Redis Channel Layer configuration (`channels_redis`).
- Pub/Sub grouping mechanics.
- Sharding and capacity planning.

## Out of Scope
- Detailed Redis cluster replication setup (Sentinel/Cluster).

## Definitions
- **Channel Layer**: The interface connecting the ASGI nodes to Redis.
- **Group**: A logical collection of sockets in Django Channels, backed by a Redis Pub/Sub topic.

## Architecture

### 1. Redis Channel Layer Configuration
The system utilizes `channels_redis` as the backend.
- **Capacity**: The `capacity` parameter should be tuned to prevent memory exhaustion if a consumer gets stuck, dropping older messages if the queue overflows (WebSockets are transient, dropping is preferred over crashing).
- **Expiry**: Group expiry (`group_expiry`) should be configured slightly higher than the maximum connection lifetime (24 hours) to automatically clean up orphaned groups.

### 2. Standard Pub/Sub Mechanics
As resolved, the system uses standard Redis Pub/Sub, not sticky routing or Redis Streams.
- When `publish_to_channel` is called, the payload is broadcast to the Redis Pub/Sub topic corresponding to the Group name.
- Every ASGI node subscribed to that topic receives the message, checks its local memory for matching sockets, and pushes the frame down the TCP connection.

### 3. Sharding (Future Proofing)
While a single Redis instance is sufficient for Phase 6, `channels_redis` supports sharding.
- If broadcast latency exceeds thresholds under high load, the configuration can be updated to hash Group names across multiple Redis shards, seamlessly splitting the pub/sub workload.

### 4. Broadcast Scope Rules
Every publish MUST target the smallest valid audience (e.g., user.id or request.id). There must be no unnecessary fan-out. Global broadcasts are strictly prohibited except for explicit maintenance events.

## Responsibilities
- **DevOps**: Monitor Redis CPU usage, as Pub/Sub is heavily single-threaded and bound by CPU processing speed during massive fan-out broadcasts.

## Dependencies
- **Redis 6+**: Required for the backend infrastructure.
- **channels_redis**: The Django Channels integration library.

## Open Questions
- All business and technical decisions have been resolved.

## Completion Criteria
- The reliance on standard Pub/Sub is documented.
- Configuration safeguards (capacity limits and group expiry) are established.
