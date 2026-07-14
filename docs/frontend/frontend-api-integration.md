# Frontend API Integration

## Purpose

Map backend REST endpoints to frontend ownership: API functions, React Query hooks, cache keys, and mutations. Aligns web and mobile on shared contracts.

**Base URL:** `/api/v1/`  
**Auth header:** `Authorization: Bearer <access_token>`

## Related documentation

- [frontend-architecture.md](frontend-architecture.md) — client ownership
- [frontend-state-management.md](frontend-state-management.md) — cache strategy
- Backend: `docs/implementation/{domain}/*-api-design.md`

---

## Response envelope differences

| Domain | Response shape |
|--------|----------------|
| Requests | Wrapped: `{ success, message, data, pagination? }` |
| Products, Orders, Payments, Bookings | Raw DRF serializer JSON |
| Auth | `{ user, tokens }` or `{ access, refresh }` |

`shared-packages/api-client` normalizes these into typed results.

---

## Shared ownership model

| Layer | Package / path | Responsibility |
|-------|----------------|----------------|
| Types | `shared-packages/types/src/{domain}/` | Request/response interfaces |
| API functions | `shared-packages/api-client/src/{domain}/` | `getOrders()`, `createOrder()`, etc. |
| Query keys | `shared-packages/api-client/src/queryKeys.ts` | Hierarchical keys |
| Web hooks | `web/src/features/{domain}/hooks/` | `useOrders()`, `useCreateOrder()` |
| Mobile hooks | `mobile/src/features/{domain}/hooks/` | Same hook names where possible |
| Mutations | Co-located with hooks | `useCreateRequest()`, etc. |

---

## Authentication

| Endpoint | Method | API function owner | Hook owner | Cache |
|----------|--------|-------------------|------------|-------|
| `/auth/login/` | POST | `api-client/auth` | `useLogin` (web + mobile) | Sets auth context; no query cache |
| `/auth/logout/` | POST | `api-client/auth` | `useLogout` | Clears all queries |
| `/auth/logout-all/` | POST | `api-client/auth` | `useLogoutAll` | Clears all queries |
| `/auth/refresh/` | POST | `api-client/auth` | Internal (interceptor) | Updates tokens only |

**Mutation ownership:** `useLogin`, `useLogout` — each app.  
**Cache ownership:** None (auth is context, not React Query).

---

## Requests

**Status:** Active  
**Permissions:** See `apps/requests/permissions/matrix.py`

### Endpoints

| Endpoint | Method | Permission | API function | Hook (query/mutation) |
|----------|--------|------------|--------------|----------------------|
| `/requests/` | GET | `request.view` (scoped) | `listRequests` | `useRequests` (query) |
| `/requests/` | POST | `request.create` | `createRequest` | `useCreateRequest` (mutation) |
| `/requests/{id}/` | GET | ownership | `getRequest` | `useRequest` (query) |
| `/requests/{id}/` | PATCH | `request.update` | `updateRequest` | `useUpdateRequest` (mutation) |
| `/requests/{id}/timeline/` | GET | ownership | `getRequestTimeline` | `useRequestTimeline` (query) |
| `/requests/{id}/submit/` | POST | `request.submit` | `submitRequest` | `useSubmitRequest` (mutation) |
| `/requests/{id}/assign/` | POST | `request.assign` | `assignRequest` | `useAssignRequest` (mutation) |
| `/requests/{id}/accept/` | POST | `assignment.accept` | `acceptAssignment` | `useAcceptAssignment` (mutation) |
| `/requests/{id}/decline/` | POST | `assignment.decline` | `declineAssignment` | `useDeclineAssignment` (mutation) |
| `/requests/{id}/cancel/` | POST | `request.cancel` | `cancelRequest` | `useCancelRequest` (mutation) |
| `/requests/{id}/escalate/` | POST | `request.escalate` | `escalateRequest` | `useEscalateRequest` (mutation) |
| `/requests/{id}/quotes/` | GET | ownership | `listQuotes` | `useQuotes` (query) |
| `/requests/{id}/quotes/` | POST | `quote.create` | `createQuote` | `useCreateQuote` (mutation) |
| `/requests/{id}/quote/approve/` | POST | `quote.approve` | `approveQuote` | `useApproveQuote` (mutation) |
| `/requests/{id}/quote/reject/` | POST | `quote.reject` | `rejectQuote` | `useRejectQuote` (mutation) |
| `/requests/{id}/quote/revise/` | POST | `quote.revise` | `reviseQuote` | `useReviseQuote` (mutation) |
| `/requests/{id}/quote/customer-action/` | POST | dynamic | `customerQuoteAction` | `useCustomerQuoteAction` (mutation) |
| `/requests/{id}/verify/` | POST | `verification.submit` | `submitVerification` | `useSubmitVerification` (mutation) |
| `/requests/{id}/review/` | POST | `verification.verify` | `reviewVerification` | `useReviewVerification` (mutation) |

### Cache ownership

| Query key | Invalidated by |
|-----------|----------------|
| `['requests']` | Any request mutation; WS `request.*` |
| `['requests', id]` | Mutations on that request; WS for that id |
| `['requests', id, 'timeline']` | Status mutations; WS |
| `['requests', id, 'quotes']` | Quote mutations; WS `quote.*` |

**Pagination:** limit/offset (default 20, max 100). Hook accepts `{ limit, offset, filters }`.

**WebSocket:** Subscribe on detail pages; invalidate on matching events.

---

## Bookings

**Status:** Implemented in backend; **not mounted** in `config/urls.py`. Frontend stubs behind feature flag.

### Endpoints

| Endpoint | Method | Permission | API function | Hook |
|----------|--------|------------|--------------|------|
| `/bookings/` | GET | role-scoped | `listBookings` | `useBookings` (query) |
| `/bookings/{id}/` | GET | `booking.view` | `getBooking` | `useBooking` (query) |
| `/bookings/{id}/schedule/` | POST | `booking.schedule` | `scheduleBooking` | `useScheduleBooking` (mutation) |
| `/bookings/{id}/reschedule/` | POST | `booking.reschedule` | `rescheduleBooking` | `useRescheduleBooking` (mutation) |
| `/bookings/{id}/extend/` | POST | `booking.extend` | `extendBooking` | `useExtendBooking` (mutation) |
| `/bookings/{id}/no-show/` | POST | `booking.no_show` | `reportNoShow` | `useReportNoShow` (mutation) |
| `/technicians/{id}/availability/` | GET | staff+ | `getTechnicianAvailability` | `useTechnicianAvailability` (query) |
| `/technicians/{id}/working-hours/` | PUT/PATCH | `working_hours.manage` | `updateWorkingHours` | `useUpdateWorkingHours` (mutation) |
| `/technicians/{id}/blackout-dates/` | POST | `blackout.manage` | `addBlackoutDate` | `useAddBlackoutDate` (mutation) |
| `/technicians/{id}/blackout-dates/{bid}/` | DELETE | `blackout.manage` | `removeBlackoutDate` | `useRemoveBlackoutDate` (mutation) |

**No `POST /bookings/`** — bookings are system-created on assignment acceptance.

### Cache ownership

| Query key | Invalidated by |
|-----------|----------------|
| `['bookings']` | Schedule, reschedule, extend, no-show mutations |
| `['bookings', id]` | Mutations on that booking |
| `['technicians', id, 'availability']` | Working hours / blackout mutations |

---

## Products

**Status:** Active  
**Note:** Backend uses `/categories/` and `/products/` (not `product-categories`).

### Endpoints

| Endpoint | Method | Permission | API function | Hook |
|----------|--------|------------|--------------|------|
| `/categories/` | GET | `category.view` | `listCategories` | `useCategories` (query) |
| `/categories/` | POST | `category.create` | `createCategory` | `useCreateCategory` (mutation) |
| `/categories/{id}/` | GET | `category.view` | `getCategory` | `useCategory` (query) |
| `/categories/{id}/` | PATCH | `category.update` | `updateCategory` | `useUpdateCategory` (mutation) |
| `/categories/{id}/archive/` | POST | `category.archive` | `archiveCategory` | `useArchiveCategory` (mutation) |
| `/products/` | GET | `product.view` | `listProducts` | `useProducts` (query) |
| `/products/` | POST | `product.create` | `createProduct` | `useCreateProduct` (mutation) |
| `/products/{id}/` | GET | `product.view` | `getProduct` | `useProduct` (query) |
| `/products/{id}/` | PATCH | `product.update` | `updateProduct` | `useUpdateProduct` (mutation) |
| `/products/{id}/archive/` | POST | `product.archive` | `archiveProduct` | `useArchiveProduct` (mutation) |
| `/products/{id}/inventory-adjust/` | POST | `inventory.adjust` | `adjustInventory` | `useAdjustInventory` (mutation) |

**Filters:** `category_id`, `state` on product list.

### Cache ownership

| Query key | Invalidated by |
|-----------|----------------|
| `['categories']` | Category mutations |
| `['categories', id]` | Category update/archive |
| `['products']` | Product/inventory mutations |
| `['products', id]` | Product update, inventory adjust |

Customer shop and staff catalog share `useProducts`; staff mutations invalidate shared keys.

---

## Orders

**Status:** Active

### Endpoints

| Endpoint | Method | Permission | API function | Hook |
|----------|--------|------------|--------------|------|
| `/orders/` | GET | `order.view_own` / `order.view` | `listOrders` | `useOrders` (query) |
| `/orders/` | POST | `order.create` | `createOrder` | `useCreateOrder` (mutation) |
| `/orders/{id}/` | GET | `order.view_own` / `order.view` | `getOrder` | `useOrder` (query) |
| `/orders/{id}/cancel/` | POST | `order.cancel` | `cancelOrder` | `useCancelOrder` (mutation) |
| `/orders/{id}/fulfill/` | POST | `order.fulfill` | `fulfillOrder` | `useFulfillOrder` (mutation) |

**Filters:** `state`, `customer_id` (staff+ only).

### Cache ownership

| Query key | Invalidated by |
|-----------|----------------|
| `['orders']` | create, cancel, fulfill; WS `order.created`, `order.fulfilled` |
| `['orders', id]` | cancel, fulfill; WS events for that order |

**Mutation flow (checkout):**

1. `useCreateOrder` → returns order id
2. `useInitializePayment({ order_id })` → Paystack session
3. Await WS or poll payment status
4. Invalidate `['orders', id]` and `['payments']`

---

## Payments

**Status:** Active

### Endpoints

| Endpoint | Method | Permission | API function | Hook |
|----------|--------|------------|--------------|------|
| `/payments/initialize/` | POST | `payment.initialize` | `initializePayment` | `useInitializePayment` (mutation) |
| `/payments/` | GET | `payment.view_own` / `payment.view` | `listPayments` | `usePayments` (query) |
| `/payments/{id}/` | GET | `payment.view_own` / `payment.view` | `getPayment` | `usePayment` (query) |
| `/payments/{id}/cancel/` | POST | `payment.cancel` | `cancelPayment` | `useCancelPayment` (mutation) |

**Note:** Implementation uses `POST /api/v1/payments/initialize/` with body `{ "order_id": "<uuid>" }`, not `POST /orders/{id}/initialize-payment/`.

**Webhook:** `POST /payments/webhooks/paystack/` — backend only; not called from frontend.

### Cache ownership

| Query key | Invalidated by |
|-----------|----------------|
| `['payments']` | initialize, cancel; WS `payment.paid`, `payment.failed` |
| `['payments', id]` | cancel; WS events for that payment |
| `['orders', orderId]` | Cross-invalidate on payment terminal states |

**Forbidden:** No client endpoint or mutation to mark payment paid.

---

## Notifications

**Status:** Not implemented on backend. Contracts defined for Phase 6 readiness.

### Planned endpoints (from architecture docs)

| Endpoint | Method | Permission | API function | Hook |
|----------|--------|------------|--------------|------|
| `/notifications/` | GET | authenticated | `listNotifications` | `useNotifications` (query) |
| `/notifications/{id}/` | GET | authenticated | `getNotification` | `useNotification` (query) |
| `/notifications/{id}/read/` | POST | authenticated | `markNotificationRead` | `useMarkNotificationRead` (mutation) |
| `/notifications/read-all/` | POST | authenticated | `markAllRead` | `useMarkAllNotificationsRead` (mutation) |

### Cache ownership

| Query key | Invalidated by |
|-----------|----------------|
| `['notifications']` | mark-read mutations; WS notify events |
| `['notifications', 'unread-count']` | Same |

Until REST ships, unread count and inbox are driven by WebSocket + local store only.

---

## Audit logs (Manager / Admin)

| Endpoint | Method | Permission | API function | Hook |
|----------|--------|------------|--------------|------|
| `/audit-logs/` | GET | `audit.view` | `listAuditLogs` | `useAuditLogs` (query) |
| `/audit-logs/export/` | GET | `audit.view` | `exportAuditLogs` | `useExportAuditLogs` (mutation) |

---

## Query key hierarchy

```text
['requests', { filters }]
['requests', requestId]
['requests', requestId, 'timeline']
['requests', requestId, 'quotes']

['bookings', { filters }]
['bookings', bookingId]

['categories']
['categories', categoryId]
['products', { filters }]
['products', productId]

['orders', { filters }]
['orders', orderId]

['payments', { filters }]
['payments', paymentId]

['notifications', { filters }]
['notifications', 'unread-count']

['audit-logs', { filters }]
```

---

## Mutation invalidation rules

| Mutation | Invalidate |
|----------|------------|
| `createRequest` | `['requests']` |
| `submitRequest` | `['requests', id]`, `['requests', id, 'timeline']` |
| `assignRequest` | `['requests']`, `['requests', id]` |
| `createOrder` | `['orders']`; clear cart store |
| `initializePayment` | `['payments']`, `['orders', orderId]` |
| `fulfillOrder` | `['orders']`, `['orders', id]` |
| `adjustInventory` | `['products']`, `['products', id]` |

Use `queryClient.setQueryData` only for optimistic **draft** request edits before save; not for orders or payments.

---

## Error handling

| HTTP | Client behavior |
|------|-----------------|
| 400 | Surface field errors from serializer |
| 401 | Trigger refresh; on failure logout |
| 403 | Show forbidden (portal) |
| 404 | Not found (including IDOR-masked) |
| 409 | Conflict (booking concurrency) — show retry |
| 429 | Rate limit message (auth: 30/min) |

Requests API errors may appear in `message` field of envelope.

---

## Hook naming convention

```text
use{Resource}           → list query
use{Resource}(id)       → detail query
useCreate{Resource}     → create mutation
useUpdate{Resource}     → update mutation
use{Action}{Resource}   → domain action (useSubmitRequest, useFulfillOrder)
```

Web and mobile use identical hook names; implementation may differ only in navigation side effects.

---

## OpenAPI alignment

When `ENABLE_SPECTACULAR=true`, generate types from `/api/v1/schema/` into `shared-packages/types` as a build step. Until then, types are maintained manually from implementation docs.
