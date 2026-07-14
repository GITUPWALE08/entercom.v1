# WebSocket Channel Design Implementation

## Purpose
The purpose of this document is to define the exact taxonomy, naming conventions, and grouping logic for the internal channel routing within the WebSocket domain. It translates the architectural requirement for strict channel namespaces into concrete string templates used by the Django Channels router.

## Scope
- Definition of the primary channel naming taxonomy (`[scope].[entity].[id].[action]`).
- Specification of the `user` and `role` channel hierarchies.
- Specification of shared resource channels (e.g., specific `Request` rooms).

## Out of Scope
- Code for checking permissions before joining a channel (covered in `authorization-flow.md`).
- Definition of the JSON payload structures sent over these channels (covered in `event-publishing.md`).

## Definitions
- **Channel Layer**: The Django Channels abstraction over the Redis backplane, allowing messages to be sent to named groups.
- **Group**: In Django Channels terminology, a "Group" is the equivalent of a Pub/Sub topic or channel.

## Architecture

### 1. The Channel Taxonomy
To prevent naming collisions and ensure predictable routing, all Groups within the channel layer must strictly adhere to the following taxonomy:

`[scope].[entity].[identifier].[sub_action]`

All segments must be lowercase and separated by periods. No spaces or special characters (other than hyphens and underscores) are permitted.

### 2. User Scoped Channels
These channels are strictly for delivering personal alerts and targeted payloads to a specific user, regardless of how many devices they are connected on.
- **Format**: `user.[user_id]` (e.g., `user.550e8400-e29b-41d4-a716-446655440000`)
- **Sub-channels**:
  - `user.[user_id].notifications`: Used specifically by the Notification domain to push inbox updates.
  - `user.[user_id].system`: Used for administrative forces (e.g., forcing a client reload during a deployment).
- **Implementation Rule**: As per the resolved business decision, the client is implicitly subscribed to their root `user.[user_id]` channels upon successful authentication. No explicit `SUBSCRIBE` command is required from the frontend.

### 3. Role Scoped Channels
These channels are used to broadcast general alerts to all online users possessing a specific RBAC role.
- **Format**: `role.[role_name].[action]`
- **Examples**:
  - `role.manager.alerts`: Broadcasts when a high-priority system threshold is breached.
  - `role.technician.dispatch`: Broadcasts new available jobs.
- **Implementation Rule**: As per the resolved business decision, role channels remain purely role-based without regional or hierarchical granularity in Phase 6.

### 4. Shared Resource Channels
These channels facilitate collaborative features (like Live Presence or real-time status updates) on a specific database entity.
- **Format**: `resource.[entity_type].[entity_id]`
- **Examples**:
  - `resource.request.1024`: Streams status changes and typing indicators for Request #1024.
  - `resource.quote.500`: Streams approval states for Quote #500.
- **Implementation Rule**: The frontend must explicitly send a `SUBSCRIBE` command to join these channels when a user navigates to the corresponding page.

## Responsibilities
- **Backend Naming Integrity**: The `Subscription Management Service` must strictly validate all incoming subscription requests against regex patterns representing this taxonomy before allowing a connection to bind to a Group.
- **Frontend Discipline**: The React clients must dynamically construct these channel strings perfectly to receive data.

## Dependencies
- **Django Channels (Groups)**: The underlying mechanism used to map these string names to connected sockets.

## Open Questions
- All business and technical decisions have been resolved.

## Completion Criteria
- The strict naming taxonomy for Users, Roles, and Shared Resources is documented.
- The distinction between implicit subscription (User channels) and explicit subscription (Resource channels) is defined.
