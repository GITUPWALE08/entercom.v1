# WebSocket Authorization Architecture

## Purpose
The purpose of this document is to define how access control is enforced at the channel level within the WebSocket domain. While Authentication confirms *who* the user is, Authorization confirms *what data* they are permitted to stream.

## Scope
- Validation of `SUBSCRIBE` commands sent by frontend clients.
- Enforcement of Role-based constraints for broadcast channels.
- Enforcement of Tenancy and Resource-level constraints for shared channels.
- Prevention of lateral privilege escalation via WebSocket manipulation.

## Out of Scope
- Initial connection authentication (handled in `websocket-authentication.md`).
- Definition of core business logic policies (e.g., determining *why* a customer cannot see a manager's quote).

## Definitions
- **Subscription Request**: A JSON payload sent by the client over an established WebSocket connection asking to join a specific channel (e.g., `{ "action": "subscribe", "channel": "request.1024.updates" }`).
- **Connection Scope**: The verified identity and roles of the user, established during the initial handshake.

## Architecture

### Channel Access Policies
Every incoming `SUBSCRIBE` request must be intercepted by the Subscription Management Service and passed through a rigorous authorization gate before the ASGI server links the connection to the Redis Backplane topic.

1. **Personal Channels (`user.[user_id].*`)**
   - *Policy*: Strict Identity Match.
   - *Rule*: The `user_id` in the channel namespace must exactly match the `user_id` stored in the Connection Scope. 
   - *Denial*: Any attempt to subscribe to another user's personal channel is immediately rejected.

2. **Role Channels (`role.[role_name].*`)**
   - *Policy*: Role Validation.
   - *Rule*: The `role_name` requested must exist within the array of authorized roles stored in the user's Connection Scope.
   - *Denial*: A Customer attempting to subscribe to `role.manager.escalations` will be rejected.

3. **Resource Channels (`request.[id].updates`, `quote.[id].approvals`)**
   - *Policy*: Business Logic Delegation.
   - *Rule*: The WebSocket Domain cannot inherently know if User A is allowed to view Request 1024. The Subscription Management Service must query the relevant Core Domain (e.g., the Request Domain API or database) to verify if the user possesses read-access to that specific resource ID.
   - *Caching*: To prevent database strain during reconnections, this verification should utilize a fast caching layer where possible.

### Lateral Escalation Defense
A malicious actor with a valid connection might attempt to brute-force or guess channel names (e.g., sequentially subscribing to `request.1.*`, `request.2.*`). 
- The Subscription Management Service must rate-limit `SUBSCRIBE` actions.
- Failed authorization attempts must be logged to the Audit Domain.
- Repeated consecutive authorization failures should result in the physical TCP connection being forcibly terminated and the IP temporarily blacklisted.

## Responsibilities
- **Subscription Management Service**: Act as the gatekeeper. Never implicitly trust a client's request to join a channel.
- **Core Domains (Requests, Orders, etc.)**: Must expose fast, highly-available authorization checks for the WebSocket domain to query during Resource Channel subscriptions.

## Dependencies
- **Roles Domain**: For validating Role-scoped channels.
- **Audit Domain**: For tracking malicious subscription attempts.

## Open Questions
All business and technical decisions have been resolved:

**Decision:** Permission revocation immediately unsubscribes and disconnects affected clients.

## Completion Criteria
- Strict validation rules for Personal, Role, and Resource channels are defined.
- Defenses against malicious subscription enumeration are established.
