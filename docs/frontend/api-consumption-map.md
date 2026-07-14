# API Consumption Map

## Purpose

Provide a single reference table mapping every mounted backend API endpoint to frontend hooks, React Query keys, cache/mutation ownership, and consuming pages/screens across web and mobile.

## Scope

- Authentication
- Requests
- Products (categories + products + inventory)
- Orders
- Payments
- Bookings (documented; gated until URL mount)
- Notifications (documented; gated until implementation)
- Realtime (WebSocket consumption)
- Audit logs (web manager/admin only)

## Out of Scope

- HTTP client implementation code
- Backend serializer or view logic
- Paystack webhook (`POST /payments/webhooks/paystack/`) — SYSTEM only; no UI consumer by design
- User/role management APIs (not mounted)
- OpenAPI code generation pipeline

### Page API contract exceptions

| Contract | Pages | API rule |
|----------|-------|----------|
| StaticContentPage | Web `/`, `/about`, `/services`, `/contact` | No API; static company website content |
| ClientOnlyPage | Web `/portal/customer/cart` | Downstream: `GET /products/{id}/`, `POST /orders/` at checkout |
| NavigationShellPage | Portal dashboards, admin shell | Consumes summary list APIs or links only to API-backed child routes |

## Definitions

| Term | Definition |
|------|------------|
| **API function** | Thin function in `shared-packages/api-client/src/{domain}/` |
| **Hook** | React Query wrapper in `web/src/features/` or `mobile/src/features/` |
| **Query key** | Hierarchical key in `shared-packages/api-client/src/queryKeys.ts` |
| **Cache ownership** | React Query cache partition; invalidated by mutations or WS |
| **Mutation ownership** | Hook owning the mutation and invalidation side effects |
| **Consumer** | Page or screen route from [web-app-architecture.md](web-app-architecture.md) or [mobile-app-architecture.md](mobile-app-architecture.md) |

**Base path:** `/api/v1/`  
**Auth header:** `Authorization: Bearer <access_token>`

---

## Detailed Sections

### 1. Authentication

| API Endpoint | Method | Frontend Hook | Query Key | Cache Ownership | Mutation Ownership | Consuming Pages |
|--------------|--------|---------------|-----------|-----------------|-------------------|-----------------|
| `/auth/login/` | POST | `useLogin` | — | Auth context (not RQ) | `useLogin` (web, mobile) | Web: `/login`; Mobile: `login` |
| `/auth/logout/` | POST | `useLogout` | — (clears all) | Clears entire QueryClient | `useLogout` | Web: all portal settings; Mobile: account tabs |
| `/auth/logout-all/` | POST | `useLogoutAll` | — (clears all) | Clears entire QueryClient | `useLogoutAll` | Web: customer settings; Mobile: account tabs |
| `/auth/refresh/` | POST | — (interceptor) | — | Updates tokens only | `api-client` auth interceptor | All authenticated surfaces |

---

### 2. Requests

**Response envelope:** `{ success, message, data, pagination? }`  
**List/retrieve:** Authenticated + ownership scope (no separate list codename in request matrix).

| API Endpoint | Method | Frontend Hook | Query Key | Cache Ownership | Mutation Ownership | Consuming Pages |
|--------------|--------|---------------|-----------|-----------------|-------------------|-----------------|
| `/requests/` | GET | `useRequests` | `['requests', filters]` | Requests list cache | — | Web: customer/staff request lists; Mobile: customer requests, technician jobs |
| `/requests/` | POST | `useCreateRequest` | — | Invalidates `['requests']` | `useCreateRequest` | Web: `/portal/customer/requests/new`; Mobile: `requests/new` |
| `/requests/{id}/` | GET | `useRequest` | `['requests', id]` | Request detail cache | — | Web: all request detail pages; Mobile: request/job detail |
| `/requests/{id}/` | PATCH | `useUpdateRequest` | — | Invalidates `['requests', id]` | `useUpdateRequest` | Mobile: technician job detail |
| `/requests/{id}/timeline/` | GET | `useRequestTimeline` | `['requests', id, 'timeline']` | Timeline cache | — | Web: customer timeline; Mobile: request detail |
| `/requests/{id}/submit/` | POST | `useSubmitRequest` | — | Invalidates `['requests', id]`, timeline | `useSubmitRequest` | Web: customer request detail; Mobile: request detail |
| `/requests/{id}/assign/` | POST | `useAssignRequest` | — | Invalidates `['requests']`, `['requests', id]` | `useAssignRequest` | Web: staff assign page |
| `/requests/{id}/accept/` | POST | `useAcceptAssignment` | — | Invalidates `['requests', id]` | `useAcceptAssignment` | Mobile: technician job detail |
| `/requests/{id}/decline/` | POST | `useDeclineAssignment` | — | Invalidates `['requests', id]` | `useDeclineAssignment` | Mobile: technician job detail |
| `/requests/{id}/cancel/` | POST | `useCancelRequest` | — | Invalidates `['requests']`, `['requests', id]` | `useCancelRequest` | Web: customer/staff request detail |
| `/requests/{id}/escalate/` | POST | `useEscalateRequest` | — | Invalidates `['requests', id]` | `useEscalateRequest` | Web: manager escalate |
| `/requests/{id}/quotes/` | GET | `useQuotes` | `['requests', id, 'quotes']` | Quotes cache | — | Web: customer/staff request detail |
| `/requests/{id}/quotes/` | POST | `useCreateQuote` | — | Invalidates quotes key | `useCreateQuote` | Web: staff detail; Mobile: `jobs/[id]/quote` |
| `/requests/{id}/quote/approve/` | POST | `useApproveQuote` | — | Invalidates quotes, request | `useApproveQuote` | Web: customer request detail |
| `/requests/{id}/quote/reject/` | POST | `useRejectQuote` | — | Invalidates quotes, request | `useRejectQuote` | Web: customer request detail |
| `/requests/{id}/quote/revise/` | POST | `useReviseQuote` | — | Invalidates quotes | `useReviseQuote` | Web: customer request detail |
| `/requests/{id}/quote/customer-action/` | POST | `useCustomerQuoteAction` | — | Invalidates quotes, request | `useCustomerQuoteAction` | Web: customer request detail |
| `/requests/{id}/verify/` | POST | `useSubmitVerification` | — | Invalidates request, timeline | `useSubmitVerification` | Mobile: `jobs/[id]/verify` |
| `/requests/{id}/review/` | POST | `useReviewVerification` | — | Invalidates request, timeline | `useReviewVerification` | Web: staff review page |

---

### 3. Products and categories

**Response envelope:** Raw DRF JSON.

| API Endpoint | Method | Frontend Hook | Query Key | Cache Ownership | Mutation Ownership | Consuming Pages |
|--------------|--------|---------------|-----------|-----------------|-------------------|-----------------|
| `/categories/` | GET | `useCategories` | `['categories']` | Categories list | — | Web: staff categories, customer shop |
| `/categories/` | POST | `useCreateCategory` | — | Invalidates `['categories']` | `useCreateCategory` | Web: staff categories |
| `/categories/{id}/` | GET | `useCategory` | `['categories', id]` | Category detail | — | Web: staff categories |
| `/categories/{id}/` | PATCH | `useUpdateCategory` | — | Invalidates `['categories']`, `['categories', id]` | `useUpdateCategory` | Web: staff categories |
| `/categories/{id}/archive/` | POST | `useArchiveCategory` | — | Invalidates `['categories']` | `useArchiveCategory` | Web: staff/manager categories |
| `/products/` | GET | `useProducts` | `['products', filters]` | Products list | — | Web: customer shop, staff products; Mobile: shop |
| `/products/` | POST | `useCreateProduct` | — | Invalidates `['products']` | `useCreateProduct` | Web: staff products/new |
| `/products/{id}/` | GET | `useProduct` | `['products', id]` | Product detail | — | Web: customer shop/:id, staff edit; Mobile: shop detail |
| `/products/{id}/` | PATCH | `useUpdateProduct` | — | Invalidates `['products']`, `['products', id]` | `useUpdateProduct` | Web: staff products/:id |
| `/products/{id}/archive/` | POST | `useArchiveProduct` | — | Invalidates `['products']` | `useArchiveProduct` | Web: manager inventory |
| `/products/{id}/inventory-adjust/` | POST | `useAdjustInventory` | — | Invalidates `['products']`, `['products', id]` | `useAdjustInventory` | Web: staff product edit, manager inventory |

---

### 4. Orders

| API Endpoint | Method | Frontend Hook | Query Key | Cache Ownership | Mutation Ownership | Consuming Pages |
|--------------|--------|---------------|-----------|-----------------|-------------------|-----------------|
| `/orders/` | GET | `useOrders` | `['orders', filters]` | Orders list | — | Web: customer/staff order lists; Mobile: orders tab |
| `/orders/` | POST | `useCreateOrder` | — | Invalidates `['orders']`; clears cart store | `useCreateOrder` | Web: checkout; Mobile: checkout |
| `/orders/{id}/` | GET | `useOrder` | `['orders', id]` | Order detail | — | Web: order detail pages; Mobile: orders/[id] |
| `/orders/{id}/cancel/` | POST | `useCancelOrder` | — | Invalidates `['orders']`, `['orders', id]` | `useCancelOrder` | Web: customer/staff order detail |
| `/orders/{id}/fulfill/` | POST | `useFulfillOrder` | — | Invalidates `['orders']`, `['orders', id]` | `useFulfillOrder` | Web: staff order detail |

---

### 5. Payments

| API Endpoint | Method | Frontend Hook | Query Key | Cache Ownership | Mutation Ownership | Consuming Pages |
|--------------|--------|---------------|-----------|-----------------|-------------------|-----------------|
| `/payments/initialize/` | POST | `useInitializePayment` | — | Invalidates `['payments']`, `['orders', orderId]` | `useInitializePayment` | Web: checkout; Mobile: checkout |
| `/payments/` | GET | `usePayments` | `['payments', filters]` | Payments list | — | Web: customer/staff payment lists; Mobile: `payments/index` |
| `/payments/{id}/` | GET | `usePayment` | `['payments', id]` | Payment detail | — | Web: customer + staff payment detail; Mobile: `payments/[id]` |
| `/payments/{id}/cancel/` | POST | `useCancelPayment` | — | Invalidates `['payments', id]` | `useCancelPayment` | Web: customer + staff (manager+) payment detail; Mobile: `payments/[id]` |

**Note:** Body for initialize is `{ "order_id": "<uuid>" }` per backend implementation.

---

### 6. Bookings — FEATURE GATED

Not mounted in `config/urls.py`. Hooks exist behind `VITE_FEATURE_BOOKINGS` / `EXPO_PUBLIC_FEATURE_BOOKINGS`.

| API Endpoint | Method | Frontend Hook | Query Key | Cache Ownership | Mutation Ownership | Consuming Pages |
|--------------|--------|---------------|-----------|-----------------|-------------------|-----------------|
| `/bookings/` | GET | `useBookings` | `['bookings', filters]` | Bookings list | — | Web: customer/staff booking lists; Mobile: schedule tab |
| `/bookings/{id}/` | GET | `useBooking` | `['bookings', id]` | Booking detail | — | Web: booking detail; Mobile: bookings/[id], schedule/[id] |
| `/bookings/{id}/schedule/` | POST | `useScheduleBooking` | — | Invalidates `['bookings']`, `['bookings', id]` | `useScheduleBooking` | Web: staff schedule |
| `/bookings/{id}/reschedule/` | POST | `useRescheduleBooking` | — | Invalidates `['bookings', id]` | `useRescheduleBooking` | Web/mobile booking detail |
| `/bookings/{id}/extend/` | POST | `useExtendBooking` | — | Invalidates `['bookings', id]` | `useExtendBooking` | Mobile: technician schedule/[id] |
| `/bookings/{id}/no-show/` | POST | `useReportNoShow` | — | Invalidates `['bookings', id]` | `useReportNoShow` | Web staff detail; Mobile technician |
| `/technicians/{id}/availability/` | GET | `useTechnicianAvailability` | `['technicians', id, 'availability']` | Availability cache | — | Web: manager technician availability |
| `/technicians/{id}/working-hours/` | PUT/PATCH | `useUpdateWorkingHours` | — | Invalidates availability key | `useUpdateWorkingHours` | Mobile: availability tab |
| `/technicians/{id}/blackout-dates/` | POST | `useAddBlackoutDate` | — | Invalidates availability key | `useAddBlackoutDate` | Mobile: availability tab |
| `/technicians/{id}/blackout-dates/{bid}/` | DELETE | `useRemoveBlackoutDate` | — | Invalidates availability key | `useRemoveBlackoutDate` | Mobile: availability tab |

**No `POST /bookings/`** — bookings created by system on assignment acceptance.

---

### 7. Notifications — FEATURE GATED

`apps/notifications/` not implemented. Contracts for Phase 6 readiness.

| API Endpoint | Method | Frontend Hook | Query Key | Cache Ownership | Mutation Ownership | Consuming Pages |
|--------------|--------|---------------|-----------|-----------------|-------------------|-----------------|
| `/notifications/` | GET | `useNotifications` | `['notifications', filters]` | Inbox list | — | Web: customer notifications; Mobile: notifications |
| `/notifications/{id}/` | GET | `useNotification` | `['notifications', id]` | Notification detail | — | Future detail views |
| `/notifications/{id}/read/` | POST | `useMarkNotificationRead` | — | Invalidates `['notifications']`, unread count | `useMarkNotificationRead` | Inbox screens |
| `/notifications/read-all/` | POST | `useMarkAllNotificationsRead` | — | Invalidates notifications keys | `useMarkAllNotificationsRead` | Inbox screens |

Until REST ships: `useNotificationStore` (Zustand) + WS notify events only.

---

### 8. Audit logs (web only)

| API Endpoint | Method | Frontend Hook | Query Key | Cache Ownership | Mutation Ownership | Consuming Pages |
|--------------|--------|---------------|-----------|-----------------|-------------------|-----------------|
| `/audit-logs/` | GET | `useAuditLogs` | `['audit-logs', filters]` | Audit list | — | Web: manager/admin audit-logs |
| `/audit-logs/export/` | GET | `useExportAuditLogs` | — | — | `useExportAuditLogs` | Web: admin audit export |

---

### 9. Infrastructure (web admin only)

| API Endpoint | Method | Frontend Hook | Query Key | Cache Ownership | Mutation Ownership | Consuming Pages |
|--------------|--------|---------------|-----------|-----------------|-------------------|-----------------|
| `/health/` | GET | `useHealthCheck` | `['health']` | Ephemeral | — | Web: `/portal/admin/system` |
| `/api/v1/schema/swagger-ui/` | GET | — (link only) | — | — | — | Web: admin system (if `ENABLE_SPECTACULAR`) |

---

### 10. Realtime consumption map

**Connection:** `ws/requests/?token=<access>` (requires `websocket.connect`)

| Event | Handler module | Query keys invalidated | Zustand updated | Consuming pages |
|-------|----------------|------------------------|-----------------|-----------------|
| `system.connected` | `handlers/system.ts` | — | Connection status | All WS-connected surfaces |
| `request.created` | `handlers/requests.ts` | `['requests']` | Toast | Customer dashboard, request lists |
| `request.submitted` | `handlers/requests.ts` | `['requests', id]`, timeline | Toast (staff) | Staff queue |
| `request.assigned` | `handlers/requests.ts` | `['requests']`, `['requests', id]` | Toast | Technician jobs, customer detail |
| `request.updated` | `handlers/requests.ts` | `['requests', id]` | — | Request detail |
| `request.status_changed` | `handlers/requests.ts` | `['requests', id]`, timeline | — | Request detail |
| `request.cancelled` | `handlers/requests.ts` | `['requests']`, `['requests', id]` | Toast | Request detail, lists |
| `quote.created` | `handlers/requests.ts` | `['requests', id, 'quotes']` | Toast (customer) | Customer request detail |
| `quote.approved` | `handlers/requests.ts` | quotes, request | — | Staff/customer detail |
| `quote.rejected` | `handlers/requests.ts` | quotes | — | Request detail |
| `quote.revision_requested` | `handlers/requests.ts` | quotes | — | Request detail |
| `assignment.accepted` | `handlers/requests.ts` | `['requests', id]` | — | Staff/customer detail |
| `assignment.declined` | `handlers/requests.ts` | `['requests']`, `['requests', id]` | — | Staff queue |
| `verification.submitted` | `handlers/requests.ts` | `['requests', id]` | Toast (staff) | Staff review |
| `verification.approved` | `handlers/requests.ts` | `['requests', id]` | — | Request detail |
| `verification.rejected` | `handlers/requests.ts` | `['requests', id]` | — | Request detail |
| `escalation.triggered` | `handlers/requests.ts` | `['requests']` | Toast (manager) | Manager escalations |
| `sla.breached` | `handlers/requests.ts` | — | Alert (manager) | Manager dashboard |
| `sla.warning` | `handlers/requests.ts` | — | Warning toast | Staff/manager |

**Future events (Phase 6 WS delivery not yet wired):**

| Event | Query keys invalidated | Consuming pages |
|-------|------------------------|-----------------|
| `order.created` | `['orders']` | Staff order queue; customer orders |
| `order.fulfilled` | `['orders', id]` | Customer order detail |
| `payment.paid` | `['payments', id]`, `['orders', orderId]` | Checkout, payment detail |
| `payment.failed` | `['payments', id]` | Checkout, payment detail |
| Notification events | `['notifications']`, unread count | Inbox screens |

**Per-request subscribe:** Client sends `{ action: "subscribe", request_id }` on request/job detail pages. Owner: `RequestSubscriptionManager` per app.

---

### 11. Client-only state (no API)

| State | Hook/Store | Consuming pages |
|-------|------------|-----------------|
| Cart | `useCartStore` | Web: cart, checkout; Mobile: shop, checkout |
| Payment session metadata | `usePaymentSessionStore` | Web/mobile checkout, payment return |
| Notification toasts | `useNotificationStore` | All authenticated |
| UI sidebar | `useUIStore` | Web staff/manager/admin portals |

---

## Dependencies

- [frontend-api-integration.md](frontend-api-integration.md)
- [frontend-state-management.md](frontend-state-management.md)
- [web-app-architecture.md](web-app-architecture.md)
- [mobile-app-architecture.md](mobile-app-architecture.md)
- [frontend-realtime-strategy.md](frontend-realtime-strategy.md)
- Backend: `apps/*/api/urls.py`, `docs/implementation/*-api-design.md`

## Open Questions

- UNRESOLVED — Exact notification REST paths when `apps/notifications/` ships.
- UNRESOLVED — Order/payment WS handler registration when broadcaster connects to `event_publisher`.
- UNRESOLVED — OpenAPI-generated hook naming vs manual hooks.

## Completion Criteria

- [ ] Every mounted human-facing endpoint has at least one consuming page/screen.
- [ ] SYSTEM-only endpoints (`webhook.process`) documented with no UI consumer.
- [ ] Page API contracts documented for static, client-only, and shell pages.
- [ ] Gated domains (bookings, notifications) marked consistently.
- [ ] Web and mobile share hook names and query keys for shared domains.
- [ ] Realtime map covers all events in `apps/requests/events/types.py` and future order/payment specs.
