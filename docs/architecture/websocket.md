# WebSocket architecture

## Scope (strict)

WebSockets are used **only** for:

1. **Support chat**
2. **Notifications**
3. **Request status updates**

Other data uses **REST**. Do not mirror the entire REST surface over WebSockets.

## Channel separation

| Namespace | Purpose | Example group |
|-----------|---------|----------------|
| `support` | Chat threads | `support.thread.{thread_id}` |
| `notify` | User/org notifications | `notify.user.{user_id}` |
| `requests` | Status updates | `requests.user.{user_id}` or `requests.entity.{request_id}` |

Exact group names live in `apps.websocket` routing. **Convention:** lowercase, dot-separated, resource-oriented.

## Event envelope

Use a consistent JSON message shape:

```json
{
  "event": "requests.status_changed",
  "version": 1,
  "payload": {}
}
```

| Field | Rule |
|-------|------|
| `event` | Stable name: `{domain}.{past_tense_action}` or `{domain}.{noun}.{verb}` — document in changelog when adding events. |
| `version` | Increment when **payload** has breaking changes. |
| `payload` | Minimal fields needed for UI refresh; prefer IDs + hints over full aggregates unless measured need. |

## Naming conventions

- **Channel layer:** Redis-backed `channels` for horizontal scale.
- **Consumers:** `consumers.py` per domain or grouped under `apps/websocket`.
- **Authorization:** On `connect` and before emitting to a group — same permission helpers as REST ([auth.md](auth.md)).

## Scaling

- Redis channel layer supports multiple API processes and workers.
- Sticky sessions are **not** required for WebSockets when the Redis layer is configured correctly.

## Boundaries

- WebSocket messages are **notifications**, not a second RPC API for arbitrary mutations.
- Mutations that change persisted state go through **REST (or future explicit mutation protocol)** and services on the backend.

## Related documentation

- [notifications.md](notifications.md) — how events reach users.
- [../workflows/request-lifecycle.md](../workflows/request-lifecycle.md) — which status changes warrant WS fan-out.
