# WebSocket Channels Architecture

## Purpose
The purpose of this document is to define the namespace design, logical separation, and routing hierarchy of WebSocket Channels within the Entercom platform. It establishes standard patterns for how clients subscribe to data and how the backend targets real-time payloads.

## Scope
- Naming conventions for channels and topics.
- Global, Tenant, User, and Resource-level channel scopes.
- Multiplexing logic for isolating data streams on a single physical connection.

## Out of Scope
- Specific Redis topic string formats (unless explicitly bound to the public channel API).
- Authentication and authorization logic for subscribing to channels (handled in `websocket-authorization.md`).

## Definitions
- **Namespace**: A logical prefix that categorizes the purpose of a channel (e.g., `user.*`, `request.*`).
- **Personal Channel**: A channel scoped exclusively to a single authenticated user (e.g., their notification inbox).
- **Resource Channel**: A channel scoped to a specific business entity, potentially shared by multiple users concurrently (e.g., a specific Service Request).
- **Global Channel**: A channel broadcast to all connected users, regardless of tenancy or role.

## Architecture

### Channel Namespace Taxonomy
To ensure scalable routing and strict access control, all channels must adhere to a rigid naming taxonomy: `[scope].[entity].[id].[action]`.

1. **User Scope (Personal Channels)**
   - *Format*: `user.[user_id].*`
   - *Examples*: `user.456.notifications`, `user.456.sessions`
   - *Usage*: Pushing unread notification counts, forced logout commands, or profile update events strictly to a single individual.

2. **Resource Scope (Shared Channels)**
   - *Format*: `[resource_type].[resource_id].*`
   - *Examples*: `request.1024.updates`, `quote.88.approvals`
   - *Usage*: Pushing state changes for a specific business entity. Both a Customer and a Staff member viewing Request #1024 would subscribe to this same channel.

3. **Tenant/Role Scope (Broadcast Channels)**
   - *Format*: `role.[role_name].*` or `tenant.[tenant_id].*`
   - *Examples*: `role.manager.escalations`, `role.technician.assignments`
   - *Usage*: Broadcasting broad operational events to a subset of users, such as alerting all Managers that a new escalation has occurred.

4. **Global Scope (System Channels)**
   - *Format*: `system.*`
   - *Examples*: `system.maintenance`, `system.version_bump`
   - *Usage*: Critical system-wide alerts, such as warning users of impending downtime or forcing a frontend client refresh due to a mandatory deployment.

### Multiplexing Strategy
A single frontend client will maintain exactly ONE physical WebSocket connection. 
- Upon connection, the client sends `SUBSCRIBE` commands for the channels it cares about based on the user's current view.
- For example, when viewing the dashboard, a Manager client subscribes to `user.[id].notifications` and `role.manager.escalations`.
- If the Manager navigates to a specific Request detail page, the client dynamically issues a `SUBSCRIBE request.[id].updates` command, and later an `UNSUBSCRIBE` when they navigate away, all without dropping the underlying physical TCP connection.

## Responsibilities
- **Subscription Service**: Parse incoming `SUBSCRIBE` commands, validate the namespace formatting, and map them to the underlying Backplane (Redis) subscriptions.
- **Frontend Client Library**: Automatically manage dynamic subscriptions based on the React component tree (e.g., a `useChannel('request.1024')` hook).

## Dependencies
- **Event Router**: Must use the exact same namespace taxonomy when mapping backend business events to outbound broadcast targets.

## Open Questions
All business and technical decisions have been resolved:

**Decision:** user.{id} channels are automatically subscribed after authentication.

**Decision:** Role channels remain role-based only.

No regional role channels during Phase 6.

## Completion Criteria
- A rigid, extensible namespace taxonomy for channels is established.
- The paradigms for Personal, Resource, Role, and Global broadcasting are defined.
- The client-side multiplexing strategy is clearly outlined.
