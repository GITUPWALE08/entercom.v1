# WebSocket Authorization Flow Implementation

## Purpose
The purpose of this document is to define the technical implementation of Authorization (Permissions and Role-Based Access Control) within the WebSocket domain, ensuring users can only subscribe to channels they have explicit rights to view.

## Scope
- Validating subscription requests to shared resource channels.
- Enforcing dynamic permission revocation.
- Integrating with the core Roles/Permissions domain.

## Out of Scope
- Defining the business logic for who owns a specific request (managed by the Requests domain).

## Definitions
- **Subscription Authorization**: The act of verifying if `user_id` has read-access to `resource_id` before allowing them to join the `resource.[type].[id]` channel.

## Architecture

### 1. Subscription Validation
When the client sends a `SUBSCRIBE` command for a shared resource (e.g., `resource.request.1024`):
- The `Subscription Management Service` parses the resource type and ID.
- It executes a non-blocking internal RPC or database query against the Core Domain to verify the user's current RBAC roles and resource assignments.
- If authorized, the socket is added to the Redis Group. If denied, an `error` frame is returned.

### 2. Dynamic Permission Revocation
As per the resolved business decision, permission revocations must be applied instantly, even to active connections.
- When a user's permissions are revoked in the Core Domain, that domain publishes an internal event (e.g., `domain.permissions.event.revoked`).
- The WebSocket domain listens for this event.
- The `Subscription Management Service` identifies all active sockets for that user and forcefully executes an `UNSUBSCRIBE` command for the restricted channel, halting the data flow immediately without dropping the entire TCP connection.

## Responsibilities
- **Core Domain**: Must actively publish events whenever authorization state changes.
- **WebSocket Domain**: Must maintain an internal mapping of users to active subscriptions to rapidly execute evictions.

## Dependencies
- **Roles/Auth Domain**: For the initial permission check during subscription.

## Open Questions
- All business and technical decisions have been resolved.

## Completion Criteria
- Subscription validation logic is defined.
- The mechanism for dynamic, real-time eviction upon permission revocation is codified.
