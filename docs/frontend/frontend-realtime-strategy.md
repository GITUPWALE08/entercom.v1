# Frontend Realtime Strategy

## Purpose

Define how web and mobile **consume** WebSocket events in Phase 6. This document covers consumption only — no transport implementation, no backend consumer code.

## Related documentation

- [../architecture/websocket.md](../architecture/websocket.md) — channel architecture
- [../architecture/notifications.md](../architecture/notifications.md) — delivery channels
- [../implementation/order/order-websocket-spec.md](../implementation/order/order-websocket-spec.md)
- [../implementation/payment/payment-websocket-spec.md](../implementation/payment/payment-websocket-spec.md)
- [frontend-state-management.md](frontend-state-management.md) — WS → cache invalidation
- [frontend-authentication.md](frontend-authentication.md) — WS auth

---

## Principles

1. **Consumption only** — Frontend reacts to events; never mutates server state via WebSocket.
2. **Single connection** — One WebSocket per app session (web tab / mobile app).
3. **Invalidate, don't duplicate** — Events trigger React Query invalidation or toasts; not entity stores.
4. **At-least-once** — Clients deduplicate by stable event id or composite key.
5. **Fail closed** — Auth failure disconnects; no anonymous private channels.
6. **Passive payloads** — Use domain event payloads as-is; no client-side payload transformation beyond parsing.

---

## Connection endpoints

| Endpoint | Status | Purpose |
|----------|--------|---------|
| `ws/system/` | Active | Handshake; emits `system.connected` |
| `ws/requests/` | Active | Request domain realtime |
| `ws/notify/` or `notify.user.{id}` group | Planned | User notifications |
| Order/payment broadcast | Planned Phase 6 | Via event bridge from domain events |

**Base URL:** Same host as API (ws/wss). Local dev: `ws://localhost:8000/ws/requests/?token=...`

---

## Authentication

| Method | Details |
|--------|---------|
| Query param | `?token=<access_token>` |
| Header | `Authorization: Bearer <access_token>` |

Required permission: `websocket.connect`

### Close codes (client actions)

| Code | Client action |
|------|---------------|
| 4001 | Logout — auth failed |
| 4002 | Refresh token → reconnect |
| 4003 | Show permission error; do not auto-reconnect |
| 4004 | Logout — role version changed; re-login required |

---

## Event envelope

All server messages use this shape:

```json
{
  "event": "request.assigned",
  "version": 1,
  "timestamp": "2026-06-24T12:00:00Z",
  "request_id": "uuid-optional",
  "payload": {
    "request_id": "...",
    "timestamp": "...",
    "data": {}
  }
}
```

Types live in `shared-packages/websocket/types.ts`.

---

## Role-based group membership

On connect to `ws/requests/`, server joins client to groups by role:

| Role | Groups |
|------|--------|
| Customer | `customer_{user_id}` |
| Technician | `technician_{user_id}` |
| Staff | `staff` |
| Manager / Superadmin | `manager` |

### Per-resource subscription (requests)

Client sends:

```json
{
  "action": "subscribe",
  "request_id": "<uuid or public id>"
}
```

Server joins `request_{request_id}` group. Unsubscribe on page leave.

**Ownership:** `web/src/services/websocket/RequestSubscriptionManager.ts`, `mobile/src/services/websocket/RequestSubscriptionManager.ts`

---

## Event catalog — Requests (active)

| Event | Typical recipients | Client action |
|-------|-------------------|---------------|
| `request.created` | customer, request group | Invalidate `['requests']`; toast |
| `request.submitted` | staff, request group | Invalidate request + timeline |
| `request.assigned` | technician, customer, request group | Invalidate request; toast to technician |
| `request.updated` | request group | Invalidate `['requests', id]` |
| `request.status_changed` | request group | Invalidate request + timeline |
| `request.cancelled` | request group, customer | Invalidate; toast |
| `quote.created` | customer, request group | Invalidate quotes; notify customer |
| `quote.approved` | request group, staff | Invalidate quotes + request |
| `quote.rejected` | request group | Invalidate quotes |
| `quote.revision_requested` | request group | Invalidate quotes |
| `assignment.accepted` | staff, customer | Invalidate request |
| `assignment.declined` | staff | Invalidate request; staff queue refresh |
| `verification.submitted` | staff | Invalidate request; staff notification |
| `verification.approved` | request group | Invalidate request |
| `verification.rejected` | request group | Invalidate request |
| `escalation.triggered` | manager | Invalidate escalations list; manager toast |
| `sla.breached` | manager | Manager alert toast |
| `sla.warning` | manager, staff | Warning toast |

Handler registry: `services/websocket/handlers/requests.ts` per app.

---

## Event catalog — Orders (future consumption)

**Source:** `order.created`, `order.fulfilled` from `OrderService` via event publisher.  
**Delivery:** Phase 6 WebSocket broadcaster (not yet wired to clients).

### order.created

| Field | Usage |
|-------|-------|
| Trigger | Customer checkout completes |
| Recipients | Customer (own order), Staff+ (all orders) |
| Client action | Invalidate `['orders']`; customer toast "Order placed"; staff dashboard badge |
| Correlation | Preserve `correlation_id` from domain event in payload |

**Customer isolation:** Customer receives only events for `customer_id === user.id`.

### order.fulfilled

| Field | Usage |
|-------|-------|
| Trigger | Staff marks order fulfilled |
| Recipients | Customer (own order), Staff+ |
| Client action | Invalidate `['orders', id]`; customer toast "Order ready" |
| Correlation | Preserve `correlation_id` |

**Forbidden:** Client must not set order state to fulfilled on WS receipt without refetch confirming server state.

---

## Event catalog — Payments (future consumption)

**Source:** `payment.paid`, `payment.failed` from webhook processing.  
**Delivery:** Phase 6 WebSocket broadcaster.

### payment.paid

| Field | Usage |
|-------|-------|
| Trigger | Paystack webhook confirms charge |
| Recipients | Customer (own payment), Staff+ (view only) |
| Client action | Invalidate `['payments', id]`, `['orders', orderId]`; close checkout UI; success toast |
| Correlation | Preserve `correlation_id` |

**Critical:** This is the preferred checkout completion signal over polling.

### payment.failed

| Field | Usage |
|-------|-------|
| Trigger | Paystack reports failure |
| Recipients | Customer (own payment) |
| Client action | Invalidate payment query; show retry UI |
| Correlation | Preserve `correlation_id` |

**Forbidden:** Client never emits or simulates `payment.paid`.

---

## Event catalog — Notifications (future consumption)

**Channel:** `notify.user.{user_id}` (per architecture docs).

Notification events may mirror domain events (e.g. `requests.status_changed`) or use dedicated notification types.

### Client consumption pattern

```text
1. Receive event on notify channel
2. Deduplicate by notification id or (event + resource id + timestamp bucket)
3. Increment unreadCount in notification store
4. Show toast if app foreground
5. Invalidate ['notifications'] when REST API available
6. On mobile background: rely on push; WS updates foreground inbox
```

Align `event` names with [notifications.md](../architecture/notifications.md). Avoid processing the same fact twice (domain handler + notification handler) without dedup.

---

## Client architecture

```text
WebSocketService (singleton)
├── connect(authToken)
├── disconnect()
├── subscribeRequest(requestId)
├── unsubscribeRequest(requestId)
├── onEvent(callback) → internal EventEmitter
└── reconnect with exponential backoff (1s, 2s, 4s, max 30s)

EventRouter
├── routes event string → handler module
├── requests.ts
├── orders.ts      (future)
├── payments.ts    (future)
└── notifications.ts (future)

Handlers
├── invalidate React Query keys
├── update notification store (toasts, unread)
└── emit app-specific side effects (navigation on payment.paid)
```

**Ownership:**

| Component | Web | Mobile |
|-----------|-----|--------|
| WebSocketService | `web/src/services/websocket/` | `mobile/src/services/websocket/` |
| Event types | `shared-packages/websocket` | shared |
| Handlers | per app (may share logic in shared-packages later) | per app |

---

## Reconnection strategy

```text
1. On disconnect (except 4001, 4003, 4004):
   a. Refresh token if near expiry
   b. Reconnect with backoff
   c. Re-join role groups (automatic on server)
   d. Re-subscribe all active request ids from subscription manager
2. On reconnect after long offline:
   a. Invalidate all active query keys (requests, orders, payments)
   b. Full refetch — do not rely on missed events alone
```

**Open question (backend):** Missed event recovery policy — client defaults to refetch-on-reconnect until resolved.

---

## Deduplication

Use composite key:

```text
`${event}:${resourceId}:${payload.version}:${payload.timestamp}`
```

Store last N keys in a ring buffer (size 100). Skip duplicate handler execution.

---

## Feature-specific consumption

### Request detail page

- On mount: `subscribe(requestId)`
- On unmount: `unsubscribe(requestId)`
- Handler: invalidate `['requests', requestId]`, timeline, quotes

### Staff request queue

- Role group membership delivers assignment events
- Handler: invalidate `['requests']` list filter

### Checkout / payment page

- Subscribe to payment events for `paymentId` or `orderId` (when server supports)
- On `payment.paid`: navigate to order confirmation
- Fallback: poll `GET /payments/{id}/` every 3s until terminal state, max 2 min

### Staff order queue

- On `order.created`: invalidate orders list; optional sound/badge

---

## Security rules (client)

1. Never subscribe to arbitrary user channels — only server-assigned groups.
2. Ignore events for resources not in current user's permitted scope (defense in depth).
3. Do not log full payment payloads in production.
4. Disconnect WS on logout before clearing tokens.

---

## Phase boundaries

| Phase | Frontend responsibility |
|-------|------------------------|
| Phase 5 | Document consumption; stub handler registry |
| Phase 6a | Implement `ws/requests/` consumption |
| Phase 6b | Add order/payment/notification handlers when backend delivers |
| Phase 6c | Push notification integration (mobile) |

---

## Testing strategy

- Mock WebSocket at service boundary
- Inject synthetic envelopes; assert query invalidation and toast calls
- Test reconnect re-subscribes active request ids
- Test deduplication ignores duplicate events
- Test 4004 triggers logout

See [frontend-testing-strategy.md](frontend-testing-strategy.md).

---

## Out of scope

- Django Channels consumers
- Redis configuration
- Event publishing
- Subscription authorization server logic
- New event types beyond approved domain contracts
