# Notification Permissions Architecture

## Purpose
The purpose of this document is to define the access control boundaries within the Notification domain. It establishes who is authorized to read, modify, and administratively query notifications and their delivery histories across the platform.

## Scope
- End-user permissions for accessing and managing their own notifications.
- Administrative permissions for interrogating system-wide delivery logs.
- Internal service-to-service authorization (e.g., orchestrator dispatch permissions).

## Out of Scope
- Implementation of the Role-Based Access Control (RBAC) middleware.
- Authentication mechanisms (e.g., JWT validation, OAuth).
- Permissions related to creating the underlying business entities (e.g., who can create a Request).

## Definitions
- **End-User**: Any authenticated user of the system (Customer, Staff, Manager) acting upon their personal notification inbox.
- **Admin-User**: A specialized internal user possessing elevated platform visibility (e.g., an Administrator troubleshooting a failed email delivery).
- **Service Identity**: The internal principal under which background workers and orchestrators operate.

## Architecture

### End-User Authorization
Notifications are strictly isolated to the user they are addressed to. The domain enforces absolute tenancy at the recipient level.
- **Read**: Users can only query notifications where `recipient_id == current_user.id`.
- **Update**: Users can only mark notifications as Read/Unread/Archived if they are the recipient.
- **Delete**: Users cannot physically delete notifications; they may only transition them to the `Archived` state.

### Administrative Authorization
Admin-Users possess global oversight capabilities required for platform health monitoring and customer support.
- **Global Read**: Admins may query any notification in the system to verify its Global State and Delivery State.
- **Delivery Inspection**: Admins may view the specific dead-letter queues and error payloads returned by external providers.
- **Manual Intervention**: Admins are authorized to trigger manual re-dispatch commands for `Dead-Lettered` or `Failed` notifications.
- **Impersonation/Mutation Limitation**: Admins are NOT authorized to mark a user's notification as Read or Unread on their behalf, preserving the integrity of the user's personal inbox state.

### Internal Service Authorization
To prevent abuse, internal APIs used for dispatching notifications must be protected.
- Services producing events (Inbound Flow) do not need explicit permission to "send a notification", as the Notification Orchestrator acts as a consumer of standard system events.
- If a generic "Send Notification" endpoint exists for internal use, it must strictly validate the `Service Identity` to prevent unauthorized domain impersonation.

## Responsibilities
- **API Gateway / Middleware**: Must firmly extract the `user_id` and role from the incoming token and pass it to the Notification Domain.
- **Notification Domain Logic**: Must apply the `recipient_id` filter unconditionally to all standard inbox queries.

## Dependencies
- **Roles Domain**: For resolving if a user possesses the required `Admin-User` policies for global inspection.

## Open Questions
All business and technical decisions have been resolved:

**Decision:** Managers may view delivery states only for notifications generated within requests they supervise.

They may not inspect unrelated user notifications.

**Decision:** Recipient resolution shall occur through the owning business domain.

Notification Service never computes authorization independently.

## Completion Criteria
- Strict recipient-level isolation is documented.
- The separation between personal inbox mutation and global administrative inspection is clearly defined.
