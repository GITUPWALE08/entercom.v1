# Frontend Routing

## Purpose

Define URL structure, portal boundaries, navigation patterns, and route protection for web and mobile. Routes map to backend RBAC roles and permission codenames.

No UI redesign. Portal chrome uses existing Layout from `shared-packages/design-system`.

## Related documentation

- [frontend-architecture.md](frontend-architecture.md) — portal ownership
- [frontend-authentication.md](frontend-authentication.md) — guards and role routing
- [../architecture/auth.md](../architecture/auth.md) — roles and permissions

---

## Routing stack

| Surface | Library | Config location |
|---------|---------|-----------------|
| Web | React Router v7 | `web/src/routes/` |
| Mobile | Expo Router | `mobile/app/` |

---

## Role → portal mapping

| User role (API) | Normalized role | Default portal / app |
|-----------------|-----------------|----------------------|
| `CUSTOMER` | `customer` | Customer Portal (web) / Customer app (mobile) |
| `TECHNICIAN` | `technician` | Technician app (mobile); optional web views |
| `STAFF` | `staff` | Staff Portal (web) |
| `MANAGER` | `manager` | Manager Portal (web) |
| `SUPER_ADMIN` | `superadmin` | Admin Portal (web) |

After login, redirect to the default home for the user's role. Users with multiple role assignments (future) resolve to highest-privilege portal they hold.

---

## Page API contract rules

Every route must satisfy one contract (see [web-app-architecture.md](web-app-architecture.md)):

| Contract | Examples |
|----------|----------|
| **API-backed** | Request list, checkout, payment detail |
| **StaticContentPage** | `/`, `/about`, `/services`, `/contact` |
| **ClientOnlyPage** | `/portal/customer/cart` → checkout APIs |
| **NavigationShellPage** | Portal dashboards; admin shell linking to audit/system |

---

## Web routes

Base URL assumes SPA hosting on Vercel. All authenticated portal routes live under a role-specific prefix.

### Public routes

No authentication required.

| Path | Page | Notes |
|------|------|-------|
| `/` | Marketing home | Uses Layout + Hero from design-system |
| `/about` | About | Public marketing |
| `/services` | Services | Public marketing |
| `/contact` | Contact | Public marketing |
| `/login` | Login | Email + password; redirects if already authenticated |
| `/health` | — | Optional redirect to backend `/health/` for ops |

### Customer Portal

Prefix: `/portal/customer`

| Path | Page | Permission (UI) | API |
|------|------|-----------------|-----|
| `/portal/customer` | Dashboard | authenticated + `customer` | `GET /requests/`, `GET /orders/`, `GET /products/` |
| `/portal/customer/requests` | Request list | `request.view` (own) | `GET /api/v1/requests/` |
| `/portal/customer/requests/new` | Create request | `request.create` | `POST /api/v1/requests/` |
| `/portal/customer/requests/:id` | Request detail | own resource | `GET /api/v1/requests/{id}/` |
| `/portal/customer/requests/:id/timeline` | Timeline | own resource | `GET /api/v1/requests/{id}/timeline/` |
| `/portal/customer/requests/:id/quotes` | Quotes | `quote.approve` etc. | quotes sub-resource |
| `/portal/customer/bookings` | Booking list | authenticated | `GET /api/v1/bookings/` (when mounted) |
| `/portal/customer/bookings/:id` | Booking detail | own resource | `GET /api/v1/bookings/{id}/` |
| `/portal/customer/shop` | Product catalog | `product.view` | `GET /api/v1/products/` |
| `/portal/customer/shop/:id` | Product detail | `product.view` | `GET /api/v1/products/{id}/` |
| `/portal/customer/cart` | Cart | authenticated | ClientOnlyPage → checkout APIs |
| `/portal/customer/checkout` | Checkout | `order.create` | `POST /api/v1/orders/` |
| `/portal/customer/orders` | Order list | `order.view_own` | `GET /api/v1/orders/` |
| `/portal/customer/orders/:id` | Order detail | own resource | `GET /api/v1/orders/{id}/` |
| `/portal/customer/payments` | Payment history | `payment.view_own` | `GET /api/v1/payments/` |
| `/portal/customer/payments/:id` | Payment detail | own resource | `GET /api/v1/payments/{id}/` |
| `/portal/customer/notifications` | Inbox | authenticated | notifications API (when mounted) |
| `/portal/customer/settings` | Account settings | authenticated | — |

### Staff Portal

Prefix: `/portal/staff`

| Path | Page | Permission (UI) | API |
|------|------|-----------------|-----|
| `/portal/staff` | Operations dashboard | `staff` role | `GET /requests/`, `GET /orders/`, `GET /products/` |
| `/portal/staff/requests` | Request queue | `request.view` | `GET /api/v1/requests/` |
| `/portal/staff/requests/:id` | Request detail | `request.view` | `GET /api/v1/requests/{id}/` |
| `/portal/staff/requests/:id/assign` | Assign technician | `request.assign` | `POST .../assign/` |
| `/portal/staff/requests/:id/review` | Verification review | `verification.verify` | `POST .../review/` |
| `/portal/staff/bookings` | Booking calendar | authenticated | `GET /api/v1/bookings/` |
| `/portal/staff/bookings/:id` | Booking detail | `booking.view` | `GET /api/v1/bookings/{id}/` |
| `/portal/staff/bookings/:id/schedule` | Schedule | `booking.schedule` | `POST .../schedule/` |
| `/portal/staff/products` | Product list | `product.view` | `GET /api/v1/products/` |
| `/portal/staff/products/new` | Create product | `product.create` | `POST /api/v1/products/` |
| `/portal/staff/products/:id` | Edit product | `product.update` | `PATCH /api/v1/products/{id}/` |
| `/portal/staff/categories` | Categories | `category.view` | `GET /api/v1/categories/` |
| `/portal/staff/orders` | Order queue | `order.view` | `GET /api/v1/orders/` |
| `/portal/staff/orders/:id` | Order detail | `order.view` | `GET /api/v1/orders/{id}/` |
| `/portal/staff/orders/:id/fulfill` | Fulfill order | `order.fulfill` | `POST .../fulfill/` |
| `/portal/staff/payments` | Payment list | `payment.view` | `GET /api/v1/payments/` |
| `/portal/staff/payments/:id` | Payment detail | `payment.view`; cancel: `payment.cancel` (manager+) | `GET /payments/{id}/`, `POST .../cancel/` |

### Manager Portal

Prefix: `/portal/manager`

Inherits staff routes where permissions overlap. Manager-only additions:

| Path | Page | Permission (UI) | API |
|------|------|-----------------|-----|
| `/portal/manager` | Manager dashboard | `manager` role | `GET /requests/`, `GET /orders/`, `GET /products/` |
| `/portal/manager/escalations` | Escalation queue | `request.escalate` | requests filtered by state |
| `/portal/manager/requests/:id/escalate` | Escalate | `request.escalate` | `POST .../escalate/` |
| `/portal/manager/inventory` | Inventory overview | `inventory.manage` | products + adjust |
| `/portal/manager/audit-logs` | Audit log viewer | `audit.view` | `GET /api/v1/audit-logs/` |
| `/portal/manager/technicians/:id/availability` | Tech availability | staff+ | `GET /api/v1/technicians/{id}/availability/` |

Staff routes under `/portal/staff/*` remain accessible to managers via shared layout or alias `/portal/manager/operations/*`.

### Admin Portal

Prefix: `/portal/admin`

| Path | Page | Permission (UI) | API |
|------|------|-----------------|-----|
| `/portal/admin` | Admin dashboard | `superadmin` | NavigationShellPage → audit, system child routes |
| `/portal/admin/audit-logs` | Full audit | `audit.view` | `GET /api/v1/audit-logs/` |
| `/portal/admin/audit-logs/export` | Export | `audit.view` | `GET /api/v1/audit-logs/export/` |
| `/portal/admin/system` | System health | `superadmin` | `GET /health/`, schema |

---

## Mobile navigation

Expo Router file-based structure. Role determined at login; app shell switches root navigator.

### Customer mobile (tabs)

| Tab | Screen | Route file |
|-----|--------|------------|
| Home | Dashboard | `app/(customer)/(tabs)/index.tsx` |
| Requests | Request list | `app/(customer)/(tabs)/requests/index.tsx` |
| Requests | Detail | `app/(customer)/(tabs)/requests/[id].tsx` |
| Shop | Catalog | `app/(customer)/(tabs)/shop/index.tsx` |
| Orders | Order list | `app/(customer)/(tabs)/orders/index.tsx` |
| Account | Profile, payment history, logout | `app/(customer)/(tabs)/account.tsx` → `payments/index` |

Stack screens (modal or push):

- `app/(customer)/requests/new.tsx` — create request
- `app/(customer)/checkout.tsx` — checkout flow
- `app/(customer)/payments/index.tsx` — payment history (`GET /api/v1/payments/`)
- `app/(customer)/payments/[id].tsx` — payment status / Paystack redirect return
- `app/(customer)/bookings/[id].tsx` — booking detail
- `app/(customer)/notifications.tsx` — inbox

### Technician mobile (tabs)

| Tab | Screen | Route file |
|-----|--------|------------|
| Jobs | Assigned requests | `app/(technician)/(tabs)/jobs/index.tsx` |
| Jobs | Detail + actions | `app/(technician)/(tabs)/jobs/[id].tsx` |
| Schedule | Bookings | `app/(technician)/(tabs)/schedule/index.tsx` |
| Availability | Working hours | `app/(technician)/(tabs)/availability.tsx` |
| Account | Profile, logout | `app/(technician)/(tabs)/account.tsx` |

Stack screens:

- `app/(technician)/jobs/[id]/verify.tsx` — submit verification
- `app/(technician)/jobs/[id]/quote.tsx` — create quote
- `app/(technician)/schedule/[id].tsx` — booking detail (extend, no-show, reschedule)

### Public mobile routes

| Route | Screen |
|-------|--------|
| `app/login.tsx` | Login |
| `app/index.tsx` | Splash / role redirect |

---

## Protected routes

### Authentication guard

Applies to all `/portal/*` (web) and `(customer)|(technician)` groups (mobile).

1. If no valid access token → redirect to `/login` (web) or `app/login.tsx` (mobile).
2. If access expired → attempt refresh via `shared-packages/api-client`.
3. If refresh fails → clear session, redirect to login.
4. If `role_version` mismatch (WS close `4004` or refresh error) → force re-login.

### Role guard

| Guard | Allowed roles | Redirect on failure |
|-------|---------------|---------------------|
| `CustomerPortalGuard` | `CUSTOMER` | Role-appropriate portal or `/login` |
| `StaffPortalGuard` | `STAFF`, `MANAGER`, `SUPER_ADMIN` | `/portal/customer` or forbidden page |
| `ManagerPortalGuard` | `MANAGER`, `SUPER_ADMIN` | `/portal/staff` |
| `AdminPortalGuard` | `SUPER_ADMIN` | `/portal/manager` |
| `TechnicianGuard` | `TECHNICIAN` | Mobile login |
| `CustomerMobileGuard` | `CUSTOMER` | Mobile login |

### Permission guard (fine-grained)

Use for individual pages and action buttons:

```
<PermissionGate permission="request.assign">
  <AssignButton />
</PermissionGate>
```

Route-level permission map lives in `web/src/routes/permissions.ts` and `mobile/src/navigation/permissions.ts`.

### Resource ownership guard

Detail routes (`/requests/:id`, `/orders/:id`) do not rely on client-side IDOR checks alone. If API returns `404`, show not-found (not forbidden) per backend IDOR masking.

---

## Public routes summary

| Surface | Public | Everything else |
|---------|--------|-----------------|
| Web | `/`, `/about`, `/services`, `/contact`, `/login` | Protected |
| Mobile | `login`, splash | Protected by role group |

---

## Navigation UX rules

1. **Marketing vs app** — Public pages use full Layout (nav + hero + footer). Portal pages use portal layout (sidebar or top nav) without marketing Hero.
2. **Deep links** — Payment return URLs and notification taps resolve to authenticated routes; stash intended path pre-login.
3. **Breadcrumbs** — Staff, Manager, Admin portals use breadcrumbs on detail pages.
4. **404 / 403** — Dedicated pages; 403 does not leak resource existence on ownership failures (mirror API 404).
5. **Logout** — Always returns to `/login`; clears query cache and WebSocket connection.

---

## Route → layout mapping

| Route prefix | Layout component |
|--------------|------------------|
| `/` (public) | `Layout` (design-system) + `Hero` on home only |
| `/portal/customer/*` | `CustomerPortalLayout` |
| `/portal/staff/*` | `StaffPortalLayout` |
| `/portal/manager/*` | `ManagerPortalLayout` |
| `/portal/admin/*` | `AdminPortalLayout` |
| Mobile customer | `CustomerTabLayout` |
| Mobile technician | `TechnicianTabLayout` |

---

## Backend mount gates

Routes for bookings and notifications are defined above but **must be feature-flagged** until backend mounts:

- Bookings: `apps.bookings.api.urls` not in active `config/urls.py`
- Notifications: `apps/notifications/` not implemented

Flag keys: `VITE_FEATURE_BOOKINGS`, `VITE_FEATURE_NOTIFICATIONS` (web); `EXPO_PUBLIC_FEATURE_*` (mobile).
