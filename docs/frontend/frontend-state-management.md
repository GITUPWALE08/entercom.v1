# Frontend State Management

## Purpose

Define what state lives where, who owns it, and how web and mobile stay consistent. Server truth always originates from the backend API.

## Stack

| Concern | Library | Scope |
|---------|---------|-------|
| Server/async state | TanStack Query v5 | Per app (`web/`, `mobile/`) |
| Client/ephemeral UI | Zustand | Per app |
| Forms | React Hook Form + Zod (`shared-packages/validation`) | Per feature |
| URL state | React Router search params / Expo Router params | Routing layer |

---

## State categories

### Global state

**Definition:** App-wide UI state that is not server data and not tied to a single feature.

| State | Owner | Storage | Examples |
|-------|-------|---------|----------|
| Sidebar collapsed | Web Zustand `useUIStore` | Memory | Staff portal nav |
| Theme preference | Web: `prefers-color-scheme` + optional override | localStorage | Light/dark via CSS tokens |
| Active portal context | Derived from route | Router | Not duplicated in store |
| Online/offline | Mobile Zustand | NetInfo | Offline banner |
| Modal stack (global) | Zustand `useModalStore` | Memory | Confirm dialogs |

**Rule:** Do not put server entities in global Zustand. Use React Query.

---

### Server state

**Owner:** TanStack Query in each app; query key factory in `shared-packages/api-client/src/queryKeys.ts`.

| Domain | Query keys prefix | Invalidation triggers |
|--------|-------------------|----------------------|
| Requests | `['requests']` | Mutations, WS `request.*` events |
| Bookings | `['bookings']` | Schedule/reschedule mutations, future WS |
| Products | `['products']`, `['categories']` | CRUD mutations |
| Orders | `['orders']` | Create/cancel/fulfill, WS `order.*` |
| Payments | `['payments']` | Initialize/cancel, WS `payment.*` |
| Notifications | `['notifications']` | WS notify events, mark-read mutation |
| Audit logs | `['audit-logs']` | Manager portal only; no WS |

**Defaults:**

- `staleTime`: 30s for lists, 10s for detail pages with active WS subscription
- `retry`: 2 for queries, 0 for mutations
- `refetchOnWindowFocus`: true (web), false (mobile background)

---

### Auth state

**Owner:** `shared-packages/auth` (types + helpers) + app `AuthProvider`.

| Field | Source | Persisted |
|-------|--------|-----------|
| `user` | Login response | Memory; re-fetch on app load via refresh |
| `accessToken` | Login / refresh | Web: memory; Mobile: SecureStore |
| `refreshToken` | Login / refresh | Web: httpOnly cookie (preferred) or secure storage; Mobile: SecureStore |
| `isAuthenticated` | Derived | — |
| `role` | `user.role` normalized | — |
| `permissions` | JWT claims or future permissions endpoint | Memory |

**Not in Zustand.** Auth context is the single source; hooks: `useAuth()`, `usePermission()`, `useRole()`.

On logout: clear tokens, reset query client, disconnect WebSocket.

See [frontend-authentication.md](frontend-authentication.md).

---

### Notification state

**Owner:** Zustand `useNotificationStore` per app + React Query for inbox list (when API exists).

| Slice | Type | Updated by |
|-------|------|------------|
| `toasts` | Ephemeral queue | WS events, mutation success |
| `unreadCount` | Number | WS, inbox fetch, mark-read |
| `inboxOpen` | Boolean | UI |
| `recentEvents` | Deduped ring buffer | WS (at-least-once dedup by event id) |

WS handler invalidates `['notifications']` and appends toast. Push notifications (mobile) deep-link and increment unread.

---

### Cart state

**Owner:** Zustand `useCartStore` — **client-only until checkout**.

| Field | Notes |
|-------|-------|
| `items[]` | `{ productId, quantity, unitPrice snapshot }` |
| `persist` | localStorage (web), AsyncStorage (mobile) |

**Boundary:** Cart is not server state. On checkout, `POST /api/v1/orders/` sends line items; order becomes server state. Clear cart on successful order creation.

**Invalidation:** Product price changes do not auto-update cart snapshots; show stale price warning at checkout (re-fetch products).

---

### Booking state

**Owner:** React Query (server) + minimal UI state.

| State | Owner |
|-------|-------|
| Booking list/detail | React Query `['bookings']` |
| Calendar view range | URL search params or local UI state |
| Schedule form draft | React Hook Form (ephemeral) |
| Selected technician filter | URL or Zustand (staff portal) |

No Zustand slice for booking entities. Bookings are system-created; UI never optimistically creates a booking record.

**Feature flag:** Disabled until backend mounts booking routes.

---

### Order state

**Owner:** React Query.

| State | Owner |
|-------|-------|
| Order list/detail | `['orders']` |
| Checkout wizard step | Zustand or URL (checkout flow only) |
| Pending checkout order id | Memory during payment flow |

After `POST /api/v1/orders/`, order id drives payment initialization. Do not mark order fulfilled client-side.

---

### Payment state

**Owner:** React Query + ephemeral checkout state.

| State | Owner |
|-------|-------|
| Payment list/detail | `['payments']` |
| Active payment session | Zustand `usePaymentSessionStore` | Paystack redirect / popup reference |
| Payment status for active checkout | React Query polling **or** WS `payment.paid` / `payment.failed` |

**Critical rule:** Payment `paid` / `failed` state updates only from:

1. WebSocket event (future Phase 6 delivery), or
2. Polling `GET /api/v1/payments/{id}/` after redirect, or
3. User navigating to payment detail after webhook processing

Never set paid status locally without server confirmation.

---

### Request state

**Owner:** React Query + WebSocket invalidation.

| State | Owner |
|-------|-------|
| Request list/detail/timeline | `['requests']` |
| Quotes sub-resource | `['requests', id, 'quotes']` |
| Active request subscription | WS service (not Zustand) |
| Draft request form | React Hook Form until `POST` succeeds |

Realtime: connect to `ws/requests/`, subscribe per detail page via `{ action: "subscribe", request_id }`.

---

### WebSocket state

**Owner:** App WebSocket service (not React Query, not Zustand for domain data).

| State | Location |
|-------|----------|
| Connection status | `useWebSocketStatus()` hook |
| Reconnect backoff | WS service internal |
| Subscribed channels | WS service internal set |
| Last event timestamp | WS service (for debugging) |

**Handler pattern:** WS event → map to query key invalidation or toast; **do not** merge payloads into Zustand entity stores. React Query refetch is source of truth after events.

```text
WS event → handler → queryClient.invalidateQueries(['orders', id])
                   → notificationStore.addToast(...)
```

---

## Ownership boundaries matrix

| State type | shared-packages | web | mobile |
|------------|-----------------|-----|--------|
| DTO types | owns | imports | imports |
| Query keys | owns | imports | imports |
| API functions | owns | imports | imports |
| React Query hooks | — | owns per feature | owns per feature |
| QueryClient instance | — | owns | owns |
| Auth context | types/helpers | owns provider | owns provider |
| Token storage adapter | interface | owns impl | owns impl |
| Cart store | — | owns | owns |
| Notification UI store | — | owns | owns |
| WebSocket connection | types/constants | owns service | owns service |
| Form validation schemas | owns | imports | imports |

---

## Anti-patterns (forbidden)

1. Duplicating server entities in Zustand (e.g. caching orders in both RQ and Zustand).
2. Optimistic payment or order fulfillment without server acknowledgment.
3. Creating booking records in client state.
4. Per-feature WebSocket connections.
5. Fetching in `useEffect` bypassing React Query.
6. Storing refresh tokens in plain localStorage on web (use httpOnly cookie or secure pattern).

---

## Store file locations

### Web (`web/src/stores/`)

- `uiStore.ts` — sidebar, theme override
- `cartStore.ts` — shop cart
- `notificationStore.ts` — toasts, unread badge
- `paymentSessionStore.ts` — active Paystack session metadata

### Mobile (`mobile/src/stores/`)

- Same slice names; cart uses AsyncStorage persist middleware
- `networkStore.ts` — connectivity (mobile only)

---

## Initialization sequence

1. App mount → restore refresh token → silent refresh
2. AuthProvider sets user context
3. QueryClient hydrates (no SSR in Phase 6)
4. WebSocket connect if authenticated + `websocket.connect` permission
5. Fetch unread notification count (when API available)
6. Render routed page; feature hooks subscribe to queries and WS as needed

---

## Testing implications

- React Query: use `@tanstack/react-query` test utilities with isolated `QueryClient`
- Zustand: reset store between tests
- WS: mock service at handler boundary, not socket level in component tests

See [frontend-testing-strategy.md](frontend-testing-strategy.md).
