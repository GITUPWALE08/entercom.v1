# WebSocket Presence Architecture

## Purpose
The purpose of this document is to define how the system tracks and broadcasts the online/offline status of users in real-time. This enables features like live indicator dots, "currently viewing" avatars, and optimized assignment routing for online staff.

## Scope
- Connection aggregation (handling multiple devices per user).
- State transition debouncing (preventing offline "flicker").
- Global presence registry (Redis).
- Internal presence event broadcasting.

## Out of Scope
- Granular presence states (e.g., "Away", "Do Not Disturb" - Phase 6 supports strictly Online/Offline).
- Persistent storage of historical presence logs in the primary PostgreSQL database.

## Definitions
- **Presence Ledger**: The central, in-memory store (Redis) that maintains the definitive list of currently online users.
- **Connection Aggregation**: The logic required to handle a single user having multiple concurrent WebSocket connections (e.g., open on a laptop and a mobile device simultaneously).
- **Debouncing**: Introducing a small, deliberate delay before declaring a user "Offline" to account for transient network drops (e.g., switching from Wi-Fi to Cellular).

## Architecture

### Global Presence Ledger
The Presence Management Service relies on Redis to maintain a global view of all connected users across all ASGI nodes.
- **Data Structure**: A Redis Hash or Sorted Set mapping `user_id` to an `active_connection_count`.
- **Increment**: When a new connection is authenticated, the ASGI node increments the user's connection count in Redis.
- **Decrement**: When a connection is closed, the ASGI node decrements the user's connection count in Redis.

### State Transitions & Aggregation
Because users operate across multiple tabs or devices, a user is only considered "Online" or "Offline" based on the aggregate connection count, not the lifecycle of a single TCP socket.

1. **Online Transition**: 
   - Occurs when the user's connection count transitions from `0` to `1`.
   - The Presence Management Service immediately emits a `UserOnline` internal system event.
   - Core domains (like Notifications) can react to this (e.g., flushing pending alerts via WebSocket).

2. **Offline Transition (Debounced)**:
   - Occurs when the user's connection count drops from `1` to `0`.
   - The Presence Management Service does NOT immediately emit an offline event.
   - It sets a temporary TTL on the user's status in Redis (e.g., 5 seconds).
   - If a new connection is established for that user within 5 seconds (e.g., a page refresh or mobile network handoff), the TTL is cleared, and no state change is broadcast.
   - If the TTL expires, the user is definitively marked as Offline, and a `UserOffline` internal system event is emitted.

### Broadcasting Presence
Once a definitive state transition occurs, it must be broadcast to the necessary channels.
- **Role Channels**: A user coming online might trigger an event published to `role.manager.presence` so that all managers can see active staff.
- **Resource Channels**: If the user is actively viewing a specific Request, their presence might be published to `request.[id].presence`.

## Responsibilities
- **Presence Management Service**: Maintain the integrity of the Redis ledger. Implement the debouncing logic accurately to prevent spamming the event bus with false disconnects.
- **Frontend Client Library**: Visually render the presence state of relevant users based on the events received via the WebSocket.

## Dependencies
- **Redis**: Serves as the high-speed, atomic source of truth for connection counts across the distributed ASGI cluster.

## Open Questions
All business and technical decisions have been resolved:

**Decision:** Presence is scoped to shared resources only.

No global online directory.

## Completion Criteria
- The methodology for connection aggregation is established.
- The debouncing strategy for handling transient disconnects is explicitly defined.
- The reliance on Redis as the global presence ledger is codified.
