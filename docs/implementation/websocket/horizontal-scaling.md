# WebSocket Horizontal Scaling Implementation

## Purpose
The purpose of this document is to define the technical configuration and architecture required to horizontally scale the WebSocket domain, supporting high concurrency across multiple ASGI nodes.

## Scope
- ASGI node configuration and density targets.
- Load balancer routing requirements.
- Connection state sharing.

## Out of Scope
- Auto-scaling metric definitions (e.g., CPU vs Memory triggers).

## Definitions
- **ASGI Node**: A single instance of Daphne or Uvicorn running the Django Channels application.
- **Backplane**: The shared infrastructure (Redis) that allows ASGI nodes to pass messages to each other.

## Architecture

### 1. Connection Density Target
As per the resolved business decision, the system targets **5,000 concurrent connections per ASGI node**.
- To achieve this, the ASGI servers must be configured with a high file descriptor limit (`ulimit -n`).
- Memory allocation must account for approximately 50KB to 100KB of RAM per active connection (handling the scope and internal buffers).

### 2. Load Balancer Configuration
Because all connection state is stored centrally in Redis, the WebSocket nodes are entirely stateless.
- **Sticky Sessions**: NOT required.
- **Routing**: The Load Balancer should use standard Round Robin or Least Connections algorithms to distribute incoming WebSocket handshakes evenly across the ASGI pool.
- **Timeouts**: The Load Balancer must be configured with long idle timeouts (e.g., 60 seconds) to accommodate the Heartbeat cycle.

### 3. Multi-Region Scope
As per the resolved business decision, a multi-region WebSocket backplane (e.g., Active-Active Redis) is out of scope for Phase 6. All scaling will occur within a single primary region.

## Responsibilities
- **Infrastructure Team**: Must provision ASGI pods with sufficient memory and appropriate ulimits to hit the 5,000 connection density target.
- **Application Layer**: Must strictly avoid storing connection state in local node memory (RAM) that other nodes might need to access.

## Dependencies
- **Daphne/Uvicorn**: The ASGI server capable of async multiplexing.
- **Redis**: The centralized state store.

## Open Questions
- All business and technical decisions have been resolved.

## Completion Criteria
- Connection density targets are codified.
- The stateless nature of the ASGI nodes and LB configuration rules are defined.
