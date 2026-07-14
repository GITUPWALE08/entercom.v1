# WebSocket Subscription Management Implementation

## Purpose
The purpose of this document is to define the technical implementation of the Subscription Management Service, which handles the lifecycle of assigning active connections to specific Redis Groups based on client requests and server-side rules.

## Scope
- Handling `SUBSCRIBE` and `UNSUBSCRIBE` frames.
- Implicit vs. Explicit subscriptions.
- Integration with the Channel Layer (Django Channels).

## Out of Scope
- Authorization validation logic (covered in `authorization-flow.md`).

## Definitions
- **Implicit Subscription**: Channels the server automatically binds the client to upon connection (e.g., personal user channels).
- **Explicit Subscription**: Channels the client manually requests to join via a WebSocket frame.

## Architecture

### 1. Subscription Handler
When a Consumer receives a `SUBSCRIBE` system frame, it delegates to the Subscription Manager.
- **Input**: The requested `channel_name`.
- **Validation**: Ensures the name matches the taxonomy.
- **Action**: Calls `self.channel_layer.group_add(channel_name, self.channel_name)`.
- **Acknowledgment**: Sends a `system_ack` frame back to the client confirming the subscription is active.

### 2. Implicit Subscriptions
As per the resolved business decision, immediately following successful First Frame Authentication, the Manager must automatically execute `group_add` for:
- `user.[user_id].notifications`
- `user.[user_id].system`
- Appropriate `role.[role_name].*` channels based on the user's profile.

### 3. Cleanup on Disconnect
- When the socket closes, the `group_discard` method must be called for *all* active subscriptions to prevent memory leaks in the Channel Layer and phantom message routing in Redis.

## Responsibilities
- **Subscription Manager**: Must maintain a local memory set of all channels the current socket is subscribed to, facilitating rapid O(1) cleanup during disconnects.

## Dependencies
- **Django Channels**: Provides the `group_add` and `group_discard` primitives.

## Open Questions
- All business and technical decisions have been resolved.

## Completion Criteria
- The explicit and implicit subscription flows are defined.
- Cleanup mechanisms are codified to prevent resource leaks.
