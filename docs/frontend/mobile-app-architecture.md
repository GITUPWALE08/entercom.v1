# Mobile App Architecture

## Purpose

Define the Entercom mobile application (`mobile/`) navigation structure, role-based flows, and per-screen contracts for API consumption, permissions, and cached state ownership.

Technician and customer workflows are mobile-first. Staff, Manager, and Admin portals are web-only in Phase 6.

## Scope

- Expo Router navigation and tab structure
- Authentication flow
- Customer journeys: requests, bookings, orders, payments
- Technician journeys: assignments, verification, quotes, bookings, availability
- Per-screen API, permission, and cache ownership

## Out of Scope

- React Native screen or widget implementation
- Flutter (not in Phase 6 stack; mobile is Expo per [frontend-architecture.md](frontend-architecture.md))
- Web portal pages (see [web-app-architecture.md](web-app-architecture.md))
- Staff, Manager, Admin mobile surfaces
- Marketing pages (Layout/Hero are web-only)
- Push notification provider implementation details

## Definitions

| Term | Definition |
|------|------------|
| **Screen** | Route entry in `mobile/app/` or `mobile/src/screens/` |
| **Tab** | Bottom tab in `(customer)/(tabs)` or `(technician)/(tabs)` groups |
| **Stack screen** | Push/modal route above tabs |
| **Journey** | End-to-end user flow across multiple screens |
| **Feature gate** | Screen hidden until backend mounts API (`EXPO_PUBLIC_FEATURE_BOOKINGS`, `EXPO_PUBLIC_FEATURE_NOTIFICATIONS`) |
| **Cached state** | React Query server cache or Zustand client store |
| **ClientOnlyPage** | Client state until downstream mounted API on navigation (cart → checkout) |
| **NavigationShellPage** | Hub consuming mounted list endpoints for summary widgets |

### Page API contract rules

Same four contracts as [web-app-architecture.md](web-app-architecture.md). Every screen must be API-backed, ClientOnlyPage, or NavigationShellPage.

## Detailed Sections

### 1. Navigation architecture

#### 1.1 Root structure

```text
app/
├── index.tsx                 Splash → role redirect
├── login.tsx                 Public auth
├── (customer)/               CustomerMobileGuard
│   ├── (tabs)/               CustomerTabLayout
│   │   ├── index.tsx         Home
│   │   ├── requests/         Requests tab
│   │   ├── shop/             Shop tab
│   │   ├── orders/           Orders tab
│   │   └── account.tsx       Account
│   ├── requests/new.tsx      Stack: create request
│   ├── checkout.tsx          Stack: checkout
│   ├── payments/index.tsx    Stack: payment history list
│   ├── payments/[id].tsx     Stack: payment status
│   ├── bookings/[id].tsx     Stack: booking detail (gated)
│   └── notifications.tsx     Stack: inbox (gated)
└── (technician)/             TechnicianGuard
    ├── (tabs)/               TechnicianTabLayout
    │   ├── jobs/             Jobs tab
    │   ├── schedule/         Schedule tab (gated)
    │   ├── availability.tsx  Availability tab (gated)
    │   └── account.tsx       Account
    └── jobs/[id]/
        ├── verify.tsx        Stack: verification
        └── quote.tsx         Stack: create quote
    └── schedule/[id].tsx     Stack: booking detail (gated)
```

#### 1.2 Tab structure

**Customer tabs**

| Tab | Route | Primary domain |
|-----|-------|----------------|
| Home | `(tabs)/index` | Dashboard |
| Requests | `(tabs)/requests` | Requests |
| Shop | `(tabs)/shop` | Products |
| Orders | `(tabs)/orders` | Orders |
| Account | `(tabs)/account` | Auth, payment history link, settings |

**Technician tabs**

| Tab | Route | Primary domain |
|-----|-------|----------------|
| Jobs | `(tabs)/jobs` | Assigned requests |
| Schedule | `(tabs)/schedule` | Bookings (gated) |
| Availability | `(tabs)/availability` | Working hours, blackouts (gated) |
| Account | `(tabs)/account` | Auth, settings |

#### 1.3 Auth flow

```text
1. app/index.tsx — if tokens valid → refresh → route by role
2. CUSTOMER → (customer)/(tabs)
3. TECHNICIAN → (technician)/(tabs)/jobs
4. STAFF/MANAGER/SUPER_ADMIN → show message; deep link to web portal (no mobile portal)
5. No token → app/login.tsx
6. POST /api/v1/auth/login/ → store tokens (SecureStore) → connect ws/requests/ → role redirect
7. Logout → POST /auth/logout/ → clear SecureStore, QueryClient, WS → login
```

Token model and refresh: [frontend-authentication.md](frontend-authentication.md).

#### 1.4 Ownership summary

| Concern | Owner |
|---------|-------|
| Navigation | `mobile/app/` (Expo Router) |
| Screens | `mobile/src/screens/` |
| Feature hooks | `mobile/src/features/{domain}/hooks/` |
| Server state | TanStack Query; keys from `shared-packages/api-client/src/queryKeys.ts` |
| Cart | `mobile/src/stores/cartStore.ts` (AsyncStorage persist) |
| Notifications UI | `mobile/src/stores/notificationStore.ts` |
| Auth | `mobile/src/providers/AuthProvider.tsx` + SecureStore adapter |
| WebSocket | `mobile/src/services/websocket/` |
| Theme tokens | `mobile/src/theme/tokens.ts` (mapped from design-system `index.css`) |
| Push (future) | `mobile/src/services/push/` |

---

### 2. Customer journeys

#### 2.1 Journey: Login → home

```text
login → auth/login → (customer)/(tabs)/index
```

#### 2.2 Journey: Create and submit request

```text
(tabs)/requests → requests/new → POST /requests/ → detail → POST .../submit/
```

#### 2.3 Journey: Approve quote

```text
(tabs)/requests/[id] → POST .../quote/approve/ (or customer-action)
```

#### 2.4 Journey: Shop → order → pay

```text
(tabs)/shop → add to cart (Zustand) → checkout → POST /orders/ → POST /payments/initialize/ → payments/[id] → payments/index (history) → await paid (poll or future WS)
```

#### 2.5 Journey: View booking (gated)

```text
(tabs)/requests/[id] (linked booking) → bookings/[id] → GET /bookings/{id}/
```

---

### 3. Technician journeys

#### 3.1 Journey: Accept assignment

```text
(tabs)/jobs → jobs/[id] → POST .../accept/ or .../decline/
```

#### 3.2 Journey: Create quote

```text
jobs/[id]/quote → POST .../quotes/
```

#### 3.3 Journey: Submit verification

```text
jobs/[id]/verify → POST .../verify/
```

#### 3.4 Journey: Manage schedule (gated)

```text
(tabs)/schedule → schedule/[id] → POST .../reschedule/, .../extend/, .../no-show/
```

#### 3.5 Journey: Manage availability (gated)

```text
(tabs)/availability → PUT/PATCH .../working-hours/ → POST/DELETE .../blackout-dates/
```

---

### 4. Screen inventory — public

#### 4.1 Splash (`app/index.tsx`)

| Attribute | Value |
|-----------|-------|
| **Purpose** | Cold start; restore session; route by role |
| **APIs consumed** | `POST /api/v1/auth/refresh/` (if refresh token exists) |
| **Required permissions** | None |
| **Cached state ownership** | Auth context; no query cache until authenticated |

#### 4.2 Login (`app/login.tsx`)

| Attribute | Value |
|-----------|-------|
| **Purpose** | Email/password login |
| **APIs consumed** | `POST /api/v1/auth/login/` |
| **Required permissions** | None |
| **Cached state ownership** | Auth context; `useLogin` clears stale QueryClient on success |

---

### 5. Screen inventory — customer

#### 5.1 Home (`(customer)/(tabs)/index`)

| Attribute | Value |
|-----------|-------|
| **Page type** | NavigationShellPage |
| **Purpose** | Customer dashboard; shortcuts to requests, shop, orders |
| **APIs consumed** | `GET /api/v1/requests/`, `GET /api/v1/orders/` |
| **Required permissions** | Authenticated `CUSTOMER` |
| **Cached state ownership** | `['requests']`, `['orders']` summary queries |

#### 5.2 Request list (`(customer)/(tabs)/requests/index`)

| Attribute | Value |
|-----------|-------|
| **Purpose** | List own requests |
| **APIs consumed** | `GET /api/v1/requests/` |
| **Required permissions** | Authenticated + customer ownership scope |
| **Cached state ownership** | `useRequests` → `['requests', filters]` |

#### 5.3 Request detail (`(customer)/(tabs)/requests/[id]`)

| Attribute | Value |
|-----------|-------|
| **Purpose** | View request; submit, cancel, quote actions |
| **APIs consumed** | `GET /requests/{id}/`, `GET .../timeline/`, `GET .../quotes/`, mutations |
| **Required permissions** | Retrieve: auth + ownership; `request.submit`, `request.cancel`, `quote.approve`, `quote.reject`, `quote.revise` |
| **Cached state ownership** | `['requests', id]`, `['requests', id, 'quotes']`; WS subscribe on `ws/requests/` |

#### 5.4 Create request (`(customer)/requests/new`)

| Attribute | Value |
|-----------|-------|
| **Purpose** | Create draft request |
| **APIs consumed** | `POST /api/v1/requests/` |
| **Required permissions** | `request.create` |
| **Cached state ownership** | `useCreateRequest`; invalidates `['requests']` |

#### 5.5 Shop catalog (`(customer)/(tabs)/shop/index`)

| Attribute | Value |
|-----------|-------|
| **Purpose** | Browse products |
| **APIs consumed** | `GET /api/v1/products/`, `GET /api/v1/categories/` |
| **Required permissions** | `product.view`, `category.view` |
| **Cached state ownership** | `['products']`, `['categories']` |

#### 5.6 Product detail (inline or `(customer)/shop/[id]`)

| Attribute | Value |
|-----------|-------|
| **Purpose** | View product; add to cart |
| **APIs consumed** | `GET /api/v1/products/{id}/` |
| **Required permissions** | `product.view` |
| **Cached state ownership** | `['products', id]`; `useCartStore` |

#### 5.7 Checkout (`(customer)/checkout`)

| Attribute | Value |
|-----------|-------|
| **Purpose** | Create order; initialize payment |
| **APIs consumed** | `POST /api/v1/orders/`, `POST /api/v1/payments/initialize/` |
| **Required permissions** | `order.create`, `payment.initialize` |
| **Cached state ownership** | `useCreateOrder`, `useInitializePayment`; clear `useCartStore` on order success |

#### 5.8 Order list (`(customer)/(tabs)/orders/index`)

| Attribute | Value |
|-----------|-------|
| **Purpose** | List own orders |
| **APIs consumed** | `GET /api/v1/orders/` |
| **Required permissions** | `order.view_own` |
| **Cached state ownership** | `['orders']` |

#### 5.9 Order detail (`(customer)/(tabs)/orders/[id]`)

| Attribute | Value |
|-----------|-------|
| **Purpose** | Order status; cancel |
| **APIs consumed** | `GET /orders/{id}/`, `POST .../cancel/` |
| **Required permissions** | `order.view_own`, `order.cancel` |
| **Cached state ownership** | `['orders', id]` |

#### 5.10 Payment list (`(customer)/payments/index`)

| Attribute | Value |
|-----------|-------|
| **Page type** | API-backed |
| **Purpose** | Payment history list |
| **APIs consumed** | `GET /api/v1/payments/` |
| **Required permissions** | `payment.view_own` |
| **Cached state ownership** | `['payments']` |

#### 5.11 Payment status (`(customer)/payments/[id]`)

| Attribute | Value |
|-----------|-------|
| **Page type** | API-backed |
| **Purpose** | Paystack return; poll or await `payment.paid` / `payment.failed` |
| **APIs consumed** | `GET /api/v1/payments/{id}/`, `POST .../cancel/` |
| **Required permissions** | `payment.view_own`, `payment.cancel` |
| **Cached state ownership** | `['payments', id]`; `usePaymentSessionStore` |

#### 5.12 Booking detail (`(customer)/bookings/[id]`) — **FEATURE GATED**

| Attribute | Value |
|-----------|-------|
| **Purpose** | View booking; reschedule |
| **APIs consumed** | `GET /bookings/{id}/`, `POST .../reschedule/` |
| **Required permissions** | `calendar.view` (object); `booking.reschedule` |
| **Cached state ownership** | `['bookings', id]` |

#### 5.13 Notifications (`(customer)/notifications`) — **FEATURE GATED**

| Attribute | Value |
|-----------|-------|
| **Purpose** | In-app inbox |
| **APIs consumed** | Notifications REST (not implemented) |
| **Required permissions** | Authenticated |
| **Cached state ownership** | `['notifications']`; `useNotificationStore` |

#### 5.14 Account (`(customer)/(tabs)/account`)

| Attribute | Value |
|-----------|-------|
| **Page type** | NavigationShellPage |
| **Purpose** | Profile from auth context; link to payment history; logout |
| **APIs consumed** | `POST /api/v1/auth/logout/`, `POST /api/v1/auth/logout-all/`; navigates to `payments/index` (list API) |
| **Required permissions** | Authenticated |
| **Cached state ownership** | Auth context only |

---

### 6. Screen inventory — technician

#### 6.1 Job list (`(technician)/(tabs)/jobs/index`)

| Attribute | Value |
|-----------|-------|
| **Purpose** | List assigned requests |
| **APIs consumed** | `GET /api/v1/requests/` |
| **Required permissions** | Authenticated + assigned ownership scope |
| **Cached state ownership** | `['requests', filters]`; WS technician group |

#### 6.2 Job detail (`(technician)/(tabs)/jobs/[id]`)

| Attribute | Value |
|-----------|-------|
| **Purpose** | View assignment; accept/decline; navigate to quote/verify |
| **APIs consumed** | `GET /requests/{id}/`, `POST .../accept/`, `POST .../decline/`, `PATCH .../` |
| **Required permissions** | `assignment.accept`, `assignment.decline`, `request.update` |
| **Cached state ownership** | `['requests', id]`; WS per-request subscribe |

#### 6.3 Create quote (`(technician)/jobs/[id]/quote`)

| Attribute | Value |
|-----------|-------|
| **Purpose** | Submit quote for assigned request |
| **APIs consumed** | `POST /api/v1/requests/{id}/quotes/` |
| **Required permissions** | `quote.create` |
| **Cached state ownership** | Invalidates `['requests', id, 'quotes']` |

#### 6.4 Submit verification (`(technician)/jobs/[id]/verify`)

| Attribute | Value |
|-----------|-------|
| **Purpose** | Submit work verification evidence |
| **APIs consumed** | `POST /api/v1/requests/{id}/verify/` |
| **Required permissions** | `verification.submit` |
| **Cached state ownership** | Invalidates `['requests', id]`, timeline |

#### 6.5 Schedule list (`(technician)/(tabs)/schedule/index`) — **FEATURE GATED**

| Attribute | Value |
|-----------|-------|
| **Purpose** | List assigned bookings |
| **APIs consumed** | `GET /api/v1/bookings/` |
| **Required permissions** | Authenticated + technician assigned scope |
| **Cached state ownership** | `['bookings']` |

#### 6.6 Booking detail (`(technician)/schedule/[id]`) — **FEATURE GATED**

| Attribute | Value |
|-----------|-------|
| **Purpose** | Reschedule, extend, report no-show |
| **APIs consumed** | `GET /bookings/{id}/`, `POST .../reschedule/`, `POST .../extend/`, `POST .../no-show/` |
| **Required permissions** | `booking.reschedule`, `booking.extend`, `booking.no_show` |
| **Cached state ownership** | `['bookings', id]` |

#### 6.7 Availability (`(technician)/(tabs)/availability`) — **FEATURE GATED**

| Attribute | Value |
|-----------|-------|
| **Purpose** | Manage working hours and blackout dates (self) |
| **APIs consumed** | `PUT/PATCH /technicians/{id}/working-hours/`, `POST/DELETE .../blackout-dates/` |
| **Required permissions** | `calendar.manage_hours`, `calendar.manage_blackouts` (self technician id) |
| **Cached state ownership** | `['technicians', id, 'availability']` |

#### 6.8 Account (`(technician)/(tabs)/account`)

| Attribute | Value |
|-----------|-------|
| **Purpose** | Profile; logout |
| **APIs consumed** | `POST /auth/logout/`, `POST /auth/logout-all/` |
| **Required permissions** | Authenticated |
| **Cached state ownership** | Auth context |

---

### 7. Realtime (mobile)

| Screen | Subscription |
|--------|--------------|
| Customer request detail | `ws/requests/` + per-request subscribe |
| Customer home / request list | `customer_{user_id}` group events |
| Technician jobs | `technician_{user_id}` group + per-job subscribe |
| Checkout / payment | Future: `payment.paid`, `payment.failed` |
| Orders | Future: `order.fulfilled` |

Connection owner: `mobile/src/services/websocket/`. Requires `websocket.connect`.

---

### 8. Client-only state (mobile)

| Store | Screens | Persistence |
|-------|---------|-------------|
| `useCartStore` | Shop, checkout | AsyncStorage |
| `useNotificationStore` | All authenticated | Memory |
| `usePaymentSessionStore` | Checkout, payments/[id] | Memory |

**Payment history entry:** Account tab → `payments/index` stack (`GET /api/v1/payments/`).
| `useNetworkStore` | Global | Memory |

---

## Dependencies

- [frontend-architecture.md](frontend-architecture.md)
- [frontend-routing.md](frontend-routing.md)
- [frontend-state-management.md](frontend-state-management.md)
- [frontend-api-integration.md](frontend-api-integration.md)
- [frontend-authentication.md](frontend-authentication.md)
- [frontend-realtime-strategy.md](frontend-realtime-strategy.md)
- [web-app-architecture.md](web-app-architecture.md)

## Open Questions

- UNRESOLVED — Deep link URL for STAFF/MANAGER/SUPER_ADMIN users directed to web portal.
- UNRESOLVED — Push notification provider and device token API (not in backend Phase 6).
- UNRESOLVED — Offline queue scope (see `docs/architecture/offline-sync.md`).

## Completion Criteria

- [ ] Customer and technician screens map to mounted backend APIs only (bookings/notifications gated).
- [ ] Mobile payment list (`payments/index`) consumes `GET /api/v1/payments/`.
- [ ] No staff/manager/admin screens in mobile app.
- [ ] Hook and query key names align with [frontend-api-integration.md](frontend-api-integration.md).
- [ ] Theme tokens match [frontend-design-system.md](frontend-design-system.md) color values.
- [ ] Auth flow matches [frontend-authentication.md](frontend-authentication.md).
