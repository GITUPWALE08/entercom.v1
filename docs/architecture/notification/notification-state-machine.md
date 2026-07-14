# Notification State Machine Architecture

## Purpose
The purpose of this document is to define the exact lifecycle of a notification and its individual delivery channels from creation to terminal state. It ensures that the system has a deterministic understanding of when a notification is pending, delivered, read, or failed.

## Scope
- Global Notification State (the overall status of the notification entity).
- Delivery Channel State (the status of a specific delivery attempt, e.g., Email vs Push).
- State transition rules and terminal states.
- Read/Unread tracking.

## Out of Scope
- Code-level state machine implementations (e.g., FSM libraries).
- Provider-specific error codes (e.g., HTTP 429 from SendGrid).

## Definitions
- **Global State**: The aggregate state of the notification as viewed by the end-user (e.g., Unread, Read, Archived).
- **Delivery State**: The mechanical state of transmitting the notification payload across a specific channel (e.g., Pending, Sent, Failed).
- **Terminal State**: A state from which no further automatic transitions will occur.

## Architecture

### Global Notification State Machine
The Global State governs the user's interaction with the notification.
1. **Unread** (Initial): The notification has been created and persisted.
2. **Read**: The user has explicitly or implicitly acknowledged the notification.
3. **Archived**: The notification is hidden from the primary user view but retained.
4. **Deleted**: The notification is logically or physically removed (Terminal).

*Transitions:*
- `Unread` -> `Read` (Triggered by user action or API call)
- `Read` -> `Unread` (User manually marks as unread)
- `Unread` | `Read` -> `Archived` (Triggered by user or system retention policy)

### Delivery State Machine
Because a single notification might be dispatched to multiple channels, each channel maintains its own delivery state machine.
1. **Pending** (Initial): Queued for dispatch.
2. **Processing**: Picked up by a worker and actively transmitting.
3. **Sent**: Successfully accepted by the external provider or local WebSocket broker (Terminal for successful delivery).
4. **Failed**: Delivery failed, but is eligible for retry.
5. **Dead-Lettered**: Delivery failed permanently after max retries (Terminal for failure).

*Transitions:*
- `Pending` -> `Processing`
- `Processing` -> `Sent` (Success)
- `Processing` -> `Failed` (Transient error)
- `Failed` -> `Pending` (Retry triggered by recovery service)
- `Failed` -> `Dead-Lettered` (Max retries exceeded)

## Responsibilities
- **State Enforcement**: The domain must enforce strict transitions. A `Dead-Lettered` delivery cannot move back to `Processing` without explicit administrative intervention.
- **Idempotency**: State transitions must be idempotent. Marking a `Read` notification as `Read` should safely no-op.

## Dependencies
- **Retry Service**: Drives transitions from `Failed` back to `Pending`.
- **Admin Tools**: Can manually force transitions from `Dead-Lettered` to `Pending`.

## Open Questions
All business and technical decisions have been resolved:

**Decision:** Dead Letter represents terminal delivery failure.

Notification remains visible to the recipient.

UI displays Delivery Failed.

**Decision:** Yes.

Track both Sent and Delivered whenever provider receipts exist.

## Completion Criteria
- All possible states for both the global notification and individual deliveries are enumerated.
- Transition rules are explicit, deterministic, and account for failure scenarios.
