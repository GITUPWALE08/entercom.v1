# Notification architecture

## Goals

- Users receive **timely, permission-consistent** updates without polling the full REST surface.
- Notification delivery aligns with **RBAC** and **tenant/user** scoping ([auth.md](auth.md)).

## Channels

| Path | Use case |
|------|----------|
| **WebSocket** (`notify.*` groups) | Realtime toast, badge, in-app inbox refresh ([websocket.md](websocket.md)) |
| **Push (mobile)** | Background or killed-state alerts; platform tokens managed per device (document concrete provider when chosen) |
| **Email / SMS** | Async, out-of-band; typically Celery tasks; idempotent sends |

## Backend shape (conceptual)

- **Persistence:** Notification records for inbox, read state, and audit.
- **Dispatch:** Service layer decides **who** receives an event and **which channels** apply.
- **Fan-out:** WebSocket emit to `notify.user.{user_id}` (or org-scoped variant) using the standard [event envelope](websocket.md#event-envelope).

## Event naming

Align WebSocket `event` names with notification types where they mirror the same fact (for example `requests.status_changed` may both update request UI and append a notification). Avoid duplicate conflicting payloads — one canonical payload shape per `event` version.

## Idempotency and ordering

- Notifications tied to domain events should use **stable deduplication keys** (for example payment reference + event type) where duplicates are costly.
- Clients should tolerate **at-least-once** delivery (show deduped UI).

## Related documentation

- [websocket.md](websocket.md) — namespaces and authorization on connect.
- [payments.md](payments.md) — post-webhook signals that trigger notifications.
