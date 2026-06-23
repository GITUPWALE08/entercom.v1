# Service request lifecycle

## Design intent

Request workflows enforce **strict transitions**, **audit logging**, **assignment tracking**, and **verification** via **centralized services** — not serializer flags or frontend-only state. Until implemented, treat this document as the **target contract** for engineering alignment.

## States (conceptual)

Define canonical states in code (single enum / model field); names below are illustrative:

| State | Meaning |
|-------|---------|
| `draft` | Customer composing; not yet submitted |
| `submitted` | Awaiting triage / auto-routing |
| `assigned` | Technician (or team) selected |
| `in_progress` | Active work |
| `pending_verification` | Work claimed complete; evidence under review |
| `completed` | Verified and closed |
| `cancelled` | Terminated per rules below |

*Diagram suggestion:* state machine diagram with guards on each edge labeled by permission + service method.

## Transition rules

- **Who may transition:** Only through service methods that check **permissions** and **preconditions** ([`../architecture/auth.md`](../architecture/auth.md)).
- **Audit:** Each transition records actor, prior state, new state, timestamp, and correlation id where available.

## Cancellation rules

| Actor | Typical rule |
|-------|----------------|
| Customer | May cancel while not **in_progress** or per product policy (define SLA window in service) |
| Staff / manager | May cancel with reason code; may require **manager** for post-assignment cancellation |
| System | Auto-cancel on timeout only if explicitly configured (document job name) |

**Hard rule:** Cancellation does not silently delete history; prefer terminal `cancelled` with reason and audit trail.

## Reassignment rules

- Reassignment requires `requests.assign` (or successor permission) **and** service-level checks (for example not after `completed`).
- Prior assignee receives **notification** and optional WebSocket event ([`../architecture/notifications.md`](../architecture/notifications.md)).
- **Race safety:** Use row-level locking or `select_for_update` in the service when changing assignment.

## Escalation logic

- **Triggers:** SLA breach, customer priority flag, repeated failures, or manual escalation by staff.
- **Effect:** Route to manager queue, bump priority, or require approval — **one** orchestrated path in a service (avoid parallel escalation paths in views and tasks without coordination).

## Approval requirements

- States that imply financial or compliance risk (refunds, fee waivers, verification override) require **manager** approval or dual control as policy dictates — encode in service preconditions, not UI alone.

## Realtime

- Status changes that affect dashboards emit WebSocket events per [`../architecture/websocket.md`](../architecture/websocket.md).

## Related documentation

- [`verification-flow.md`](verification-flow.md) — evidence and approval.
- [`technician-flow.md`](technician-flow.md) — field execution.
- [`../architecture/backend.md`](../architecture/backend.md) — service-layer ownership.
