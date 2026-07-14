# Web App Architecture

## Purpose

Define the Entercom web application (`web/`) page inventory, layout hierarchy, route hierarchy, ownership boundaries, and per-page contracts for API consumption, permissions, and realtime subscriptions.

This document extends [frontend-architecture.md](frontend-architecture.md) and [frontend-routing.md](frontend-routing.md). It does not redesign UI. Public and portal surfaces use the canonical company website assets (Layout, Hero, `tailwind.config.js`, `index.css`) via `shared-packages/design-system/`.

## Scope

- Public marketing pages
- Customer, Staff, Manager, and Admin portal pages
- Layout and route hierarchy
- Protected route rules
- Permission boundaries per page
- State, API, realtime, and shared UI ownership per page
- Backend mount gates for bookings and notifications

## Out of Scope

- React component, page, or hook implementation
- Wireframes or visual mockups
- Mobile app screens (see [mobile-app-architecture.md](mobile-app-architecture.md))
- Backend API design changes
- Admin user/role management pages (no REST API mounted: `apps/users/urls.py` and `apps/roles/urls.py` are empty)
- Technician-primary workflows (mobile-first; web technician views not in Phase 6 scope)

## Definitions

| Term | Definition |
|------|------------|
| **Page** | Route entry component mapped to a URL in `web/src/pages/` |
| **Layout** | Shell wrapping pages; from `shared-packages/design-system` or `web/src/layouts/` |
| **Portal** | Authenticated route tree prefixed `/portal/{role}/` |
| **Ownership scope** | Backend service-layer filter: customer owns resource, technician assigned, staff/manager global |
| **Feature gate** | Route hidden until backend mounts API (`VITE_FEATURE_BOOKINGS`, `VITE_FEATURE_NOTIFICATIONS`) |
| **Shared UI** | Primitives from `shared-packages/design-system` (Layout, Hero, Button, Card, Form, Table, Modal) |
| **StaticContentPage** | Marketing page with no backend API; content from existing company website assets |
| **ClientOnlyPage** | Page whose primary state is client-side until a downstream mounted API mutation |
| **NavigationShellPage** | Dashboard or hub that links to API-backed routes; may prefetch summary data via mounted list endpoints |

### Page API contract rules

Every page **must** declare a `Page type` and satisfy one of:

1. **API-backed** — consumes one or more mounted (or feature-gated) backend endpoints.
2. **StaticContentPage** — no API by design; static content from company website.
3. **ClientOnlyPage** — no API on page load; names the downstream API consumed on transition (e.g. checkout).
4. **NavigationShellPage** — consumes at least one mounted list/read endpoint for summary widgets **or** only links to API-backed child routes (admin shell).

No portal page may exist without fitting one of these contracts.

## Detailed Sections

### 1. Cross-cutting architecture

#### 1.1 Layout hierarchy

```text
AppShell (providers: Auth, QueryClient, WebSocket)
├── PublicLayout (= design-system Layout: Navbar + Footer)
│   ├── Hero (home only)
│   └── Public pages
├── CustomerPortalLayout
│   └── Customer pages
├── StaffPortalLayout
│   └── Staff pages (+ shared operations pages)
├── ManagerPortalLayout
│   └── Manager pages + inherited staff operations
└── AdminPortalLayout
    └── Admin pages
```

| Layout | Source | Used for |
|--------|--------|----------|
| `Layout` | `shared-packages/design-system/components/Layout/` | `/`, `/about`, `/services`, `/contact`, `/login` |
| `Hero` | `shared-packages/design-system/components/Hero/` | `/` only |
| `CustomerPortalLayout` | `web/src/layouts/CustomerPortalLayout` | `/portal/customer/*` |
| `StaffPortalLayout` | `web/src/layouts/StaffPortalLayout` | `/portal/staff/*` |
| `ManagerPortalLayout` | `web/src/layouts/ManagerPortalLayout` | `/portal/manager/*` |
| `AdminPortalLayout` | `web/src/layouts/AdminPortalLayout` | `/portal/admin/*` |

Portal layouts reuse design-system tokens (`index.css`, Tailwind config). They do not include Hero.

#### 1.2 Route hierarchy

```text
/                           PublicLayout + Hero
/about                      PublicLayout
/services                   PublicLayout
/contact                    PublicLayout
/login                      PublicLayout (minimal chrome)

/portal/customer/*          CustomerPortalLayout   [CustomerPortalGuard]
/portal/staff/*             StaffPortalLayout      [StaffPortalGuard: STAFF, MANAGER, SUPER_ADMIN]
/portal/manager/*           ManagerPortalLayout    [ManagerPortalGuard: MANAGER, SUPER_ADMIN]
/portal/admin/*             AdminPortalLayout      [AdminPortalGuard: SUPER_ADMIN]
```

#### 1.3 Protected routes

| Guard | Condition | Failure action |
|-------|-----------|----------------|
| `AuthGuard` | Valid access token or successful refresh | Redirect `/login` |
| `CustomerPortalGuard` | `user.role === CUSTOMER` | Redirect role home or `/403` |
| `StaffPortalGuard` | `isStaffPlus(role)` | Redirect `/portal/customer` or `/403` |
| `ManagerPortalGuard` | `MANAGER` or `SUPER_ADMIN` | Redirect `/portal/staff` |
| `AdminPortalGuard` | `SUPER_ADMIN` | Redirect `/portal/manager` |
| `PermissionGate` | `hasPermission(user, codename)` | Hide action or `/403` for route |

List/retrieve endpoints for requests and bookings use **authenticated JWT + ownership scope** in the service layer; they do not map to a separate list permission codename in `apps/requests/permissions/matrix.py`.

#### 1.4 Ownership summary

| Concern | Owner |
|---------|-------|
| Route definitions | `web/src/routes/` |
| Page components | `web/src/pages/` |
| Feature hooks | `web/src/features/{domain}/hooks/` |
| Server state (React Query) | Per-app `QueryClient`; keys in `shared-packages/api-client/src/queryKeys.ts` |
| Client UI state (cart, toasts) | `web/src/stores/` (Zustand) |
| Auth context | `web/src/providers/AuthProvider.tsx` |
| HTTP transport | `shared-packages/api-client` |
| WebSocket connection | `web/src/services/websocket/` |
| Design tokens and marketing shell | `shared-packages/design-system` |
| Portal-specific compositions | `web/src/components/` |

#### 1.5 Realtime ownership (web)

| Connection | Endpoint | Owner |
|------------|----------|-------|
| Request events | `ws/requests/` | `web/src/services/websocket/` |
| System handshake | `ws/system/` | Same service |
| Order/payment/notify (future) | TBD Phase 6 delivery | Handler modules under `services/websocket/handlers/` |

Requires `websocket.connect` (data-driven RBAC, seeded in `apps/audit_logs`).

---

### 2. Public pages

No authentication. Marketing pages are **StaticContentPage** (no backend API).

#### 2.1 Home (`/`)

| Attribute | Value |
|-----------|-------|
| **Page type** | StaticContentPage |
| **Purpose** | Company marketing landing; entry to login and portals |
| **Visible roles** | All (unauthenticated) |
| **Layout** | `Layout` + `Hero` |
| **APIs consumed** | None (static content from company website assets) |
| **Required permissions** | None |
| **Realtime subscriptions** | None |
| **State ownership** | None |
| **Shared UI** | `Layout`, `Hero`, design-system tokens |

#### 2.2 About (`/about`)

| Attribute | Value |
|-----------|-------|
| **Page type** | StaticContentPage |
| **Purpose** | Company information (static content from existing site) |
| **Visible roles** | All (unauthenticated) |
| **Layout** | `Layout` |
| **APIs consumed** | None (static content from company website assets) |
| **Required permissions** | None |
| **Realtime subscriptions** | None |

#### 2.3 Services (`/services`)

| Attribute | Value |
|-----------|-------|
| **Page type** | StaticContentPage |
| **Purpose** | Service offerings (static content from existing site) |
| **Visible roles** | All (unauthenticated) |
| **Layout** | `Layout` |
| **APIs consumed** | None (static content from company website assets) |
| **Required permissions** | None |
| **Realtime subscriptions** | None |

#### 2.4 Contact (`/contact`)

| Attribute | Value |
|-----------|-------|
| **Page type** | StaticContentPage |
| **Purpose** | Contact information (static content from existing site) |
| **Visible roles** | All (unauthenticated) |
| **Layout** | `Layout` |
| **APIs consumed** | None (static content from company website assets) |
| **Required permissions** | None |
| **Realtime subscriptions** | None |

#### 2.5 Login (`/login`)

| Attribute | Value |
|-----------|-------|
| **Purpose** | Email/password authentication; post-login role redirect |
| **Visible roles** | Unauthenticated (authenticated users redirect to role home) |
| **Layout** | `Layout` (minimal chrome) |
| **APIs consumed** | `POST /api/v1/auth/login/` |
| **Required permissions** | None (public) |
| **Realtime subscriptions** | On success: connect `ws/requests/` if `websocket.connect` |
| **State ownership** | Auth context (`shared-packages/auth` + `AuthProvider`); no React Query cache |
| **API ownership** | `useLogin` → `shared-packages/api-client/src/auth/` |

---

### 3. Customer portal pages

Prefix: `/portal/customer`. Guard: `CustomerPortalGuard`.

#### 3.1 Dashboard (`/portal/customer`)

| Attribute | Value |
|-----------|-------|
| **Page type** | NavigationShellPage |
| **Purpose** | Customer home; summary links to requests, orders, shop |
| **Visible roles** | `CUSTOMER` |
| **Layout** | `CustomerPortalLayout` |
| **APIs consumed** | `GET /api/v1/requests/`, `GET /api/v1/orders/`, `GET /api/v1/products/` (summary widgets) |
| **Required permissions** | Authenticated `CUSTOMER` |
| **Realtime subscriptions** | Role group on `ws/requests/` (`customer_{user_id}`) |
| **State ownership** | React Query for summary queries; notification unread from Zustand |

#### 3.2 Request list (`/portal/customer/requests`)

| Attribute | Value |
|-----------|-------|
| **Purpose** | List customer's own service requests |
| **Visible roles** | `CUSTOMER` |
| **Layout** | `CustomerPortalLayout` |
| **APIs consumed** | `GET /api/v1/requests/` |
| **Required permissions** | Authenticated + ownership scope (customer owns) |
| **Realtime subscriptions** | `ws/requests/` role group; invalidate on `request.*` |
| **State ownership** | `useRequests` → `['requests', filters]` |

#### 3.3 Create request (`/portal/customer/requests/new`)

| Attribute | Value |
|-----------|-------|
| **Purpose** | Create draft service request |
| **Visible roles** | `CUSTOMER` |
| **Layout** | `CustomerPortalLayout` |
| **APIs consumed** | `POST /api/v1/requests/` |
| **Required permissions** | `request.create` |
| **Realtime subscriptions** | None on create; list invalidates on success |
| **State ownership** | Form ephemeral (React Hook Form); `useCreateRequest` mutation |

#### 3.4 Request detail (`/portal/customer/requests/:id`)

| Attribute | Value |
|-----------|-------|
| **Purpose** | View request status, actions (submit, cancel, quotes) |
| **Visible roles** | `CUSTOMER` (own resource) |
| **Layout** | `CustomerPortalLayout` |
| **APIs consumed** | `GET /api/v1/requests/{id}/`, `POST .../submit/`, `POST .../cancel/`, quote endpoints |
| **Required permissions** | Retrieve: authenticated + ownership; submit: `request.submit`; cancel: `request.cancel`; quotes: `quote.approve`, `quote.reject`, `quote.revise` |
| **Realtime subscriptions** | `ws/requests/` subscribe `{ action: "subscribe", request_id }` |
| **State ownership** | `useRequest`, `useQuotes`; WS invalidates `['requests', id]` |

#### 3.5 Request timeline (`/portal/customer/requests/:id/timeline`)

| Attribute | Value |
|-----------|-------|
| **Purpose** | Chronological request events |
| **Visible roles** | `CUSTOMER` (own resource) |
| **Layout** | `CustomerPortalLayout` |
| **APIs consumed** | `GET /api/v1/requests/{id}/timeline/` |
| **Required permissions** | Authenticated + ownership scope |
| **Realtime subscriptions** | Same request subscription; invalidate on status events |
| **State ownership** | `useRequestTimeline` → `['requests', id, 'timeline']` |

#### 3.6 Booking list (`/portal/customer/bookings`) — **FEATURE GATED**

| Attribute | Value |
|-----------|-------|
| **Purpose** | List customer's bookings |
| **Visible roles** | `CUSTOMER` |
| **Layout** | `CustomerPortalLayout` |
| **APIs consumed** | `GET /api/v1/bookings/` |
| **Required permissions** | Authenticated + ownership scope |
| **Realtime subscriptions** | None (bookings REST not mounted) |
| **Gate** | `VITE_FEATURE_BOOKINGS` + backend mounts `apps.bookings.api.urls` |

#### 3.7 Booking detail (`/portal/customer/bookings/:id`) — **FEATURE GATED**

| Attribute | Value |
|-----------|-------|
| **Purpose** | View booking schedule; reschedule |
| **Visible roles** | `CUSTOMER` (own booking) |
| **Layout** | `CustomerPortalLayout` |
| **APIs consumed** | `GET /api/v1/bookings/{id}/`, `POST .../reschedule/` |
| **Required permissions** | View: `calendar.view` (object scope); reschedule: `booking.reschedule` |
| **Realtime subscriptions** | None |
| **Gate** | `VITE_FEATURE_BOOKINGS` |

#### 3.8 Product catalog (`/portal/customer/shop`)

| Attribute | Value |
|-----------|-------|
| **Purpose** | Browse products for purchase |
| **Visible roles** | `CUSTOMER` |
| **Layout** | `CustomerPortalLayout` |
| **APIs consumed** | `GET /api/v1/products/`, `GET /api/v1/categories/` |
| **Required permissions** | `product.view`, `category.view` |
| **Realtime subscriptions** | None |
| **State ownership** | `useProducts`, `useCategories` |

#### 3.9 Product detail (`/portal/customer/shop/:id`)

| Attribute | Value |
|-----------|-------|
| **Purpose** | Product detail; add to cart |
| **Visible roles** | `CUSTOMER` |
| **Layout** | `CustomerPortalLayout` |
| **APIs consumed** | `GET /api/v1/products/{id}/` |
| **Required permissions** | `product.view` |
| **Realtime subscriptions** | None |
| **State ownership** | `useProduct`; cart via `useCartStore` (Zustand) |

#### 3.10 Cart (`/portal/customer/cart`)

| Attribute | Value |
|-----------|-------|
| **Page type** | ClientOnlyPage |
| **Purpose** | Review cart before checkout |
| **Visible roles** | `CUSTOMER` |
| **Layout** | `CustomerPortalLayout` |
| **APIs consumed** | On load: none (Zustand `useCartStore`). Downstream: `GET /api/v1/products/{id}/` at checkout validation; `POST /api/v1/orders/` on checkout |
| **Required permissions** | Authenticated `CUSTOMER` |
| **Realtime subscriptions** | None |
| **State ownership** | `useCartStore` (Zustand, persisted) |

#### 3.11 Checkout (`/portal/customer/checkout`)

| Attribute | Value |
|-----------|-------|
| **Purpose** | Create order from cart; initialize payment |
| **Visible roles** | `CUSTOMER` |
| **Layout** | `CustomerPortalLayout` |
| **APIs consumed** | `POST /api/v1/orders/`, `POST /api/v1/payments/initialize/` |
| **Required permissions** | `order.create`, `payment.initialize` |
| **Realtime subscriptions** | Future: `payment.paid`, `payment.failed` (Phase 6 WS delivery) |
| **State ownership** | `useCreateOrder`, `useInitializePayment`; `usePaymentSessionStore` |

#### 3.12 Order list (`/portal/customer/orders`)

| Attribute | Value |
|-----------|-------|
| **Purpose** | List customer's orders |
| **Visible roles** | `CUSTOMER` |
| **Layout** | `CustomerPortalLayout` |
| **APIs consumed** | `GET /api/v1/orders/` |
| **Required permissions** | `order.view_own` |
| **Realtime subscriptions** | Future: `order.created`, `order.fulfilled` |
| **State ownership** | `useOrders` → `['orders']` |

#### 3.13 Order detail (`/portal/customer/orders/:id`)

| Attribute | Value |
|-----------|-------|
| **Purpose** | Order status; cancel if permitted |
| **Visible roles** | `CUSTOMER` (own order) |
| **Layout** | `CustomerPortalLayout` |
| **APIs consumed** | `GET /api/v1/orders/{id}/`, `POST .../cancel/` |
| **Required permissions** | View: `order.view_own`; cancel: `order.cancel` |
| **Realtime subscriptions** | Future: `order.fulfilled` |
| **State ownership** | `useOrder`, `useCancelOrder` |

#### 3.14 Payment list (`/portal/customer/payments`)

| Attribute | Value |
|-----------|-------|
| **Purpose** | Payment history |
| **Visible roles** | `CUSTOMER` |
| **Layout** | `CustomerPortalLayout` |
| **APIs consumed** | `GET /api/v1/payments/` |
| **Required permissions** | `payment.view_own` |
| **Realtime subscriptions** | Future: `payment.paid`, `payment.failed` |
| **State ownership** | `usePayments` |

#### 3.15 Payment detail (`/portal/customer/payments/:id`)

| Attribute | Value |
|-----------|-------|
| **Purpose** | Payment status; cancel pending payment |
| **Visible roles** | `CUSTOMER` (own payment) |
| **Layout** | `CustomerPortalLayout` |
| **APIs consumed** | `GET /api/v1/payments/{id}/`, `POST .../cancel/` |
| **Required permissions** | View: `payment.view_own`; cancel: `payment.cancel` (own, not paid) |
| **Realtime subscriptions** | Future: `payment.paid`, `payment.failed` |
| **State ownership** | `usePayment`, `useCancelPayment` |

#### 3.16 Notifications inbox (`/portal/customer/notifications`) — **FEATURE GATED**

| Attribute | Value |
|-----------|-------|
| **Purpose** | In-app notification inbox |
| **Visible roles** | `CUSTOMER` |
| **Layout** | `CustomerPortalLayout` |
| **APIs consumed** | Notifications REST (not implemented); WS notify (planned) |
| **Required permissions** | Authenticated |
| **Realtime subscriptions** | Planned: `notify.user.{user_id}` |
| **Gate** | `VITE_FEATURE_NOTIFICATIONS` |

#### 3.17 Account settings (`/portal/customer/settings`)

| Attribute | Value |
|-----------|-------|
| **Purpose** | Display profile from auth context; logout / logout-all |
| **Visible roles** | `CUSTOMER` |
| **Layout** | `CustomerPortalLayout` |
| **APIs consumed** | `POST /api/v1/auth/logout/`, `POST /api/v1/auth/logout-all/` |
| **Required permissions** | Authenticated |
| **Realtime subscriptions** | Disconnect WS on logout |
| **Note** | No user profile REST API mounted |

---

### 4. Staff portal pages

Prefix: `/portal/staff`. Guard: `StaffPortalGuard` (`STAFF`, `MANAGER`, `SUPER_ADMIN`).

#### 4.1 Operations dashboard (`/portal/staff`)

| Attribute | Value |
|-----------|-------|
| **Page type** | NavigationShellPage |
| **Purpose** | Staff home; links to request queue, orders, products |
| **Visible roles** | `STAFF`, `MANAGER`, `SUPER_ADMIN` |
| **Layout** | `StaffPortalLayout` |
| **APIs consumed** | `GET /api/v1/requests/`, `GET /api/v1/orders/`, `GET /api/v1/products/` (summary widgets) |
| **Required permissions** | `isStaffPlus` role |
| **Realtime subscriptions** | `ws/requests/` staff group |
| **State ownership** | React Query summary keys |

#### 4.2 Request queue (`/portal/staff/requests`)

| Attribute | Value |
|-----------|-------|
| **Purpose** | Triage and manage all requests |
| **Visible roles** | `STAFF`, `MANAGER`, `SUPER_ADMIN` |
| **Layout** | `StaffPortalLayout` |
| **APIs consumed** | `GET /api/v1/requests/` |
| **Required permissions** | Authenticated + global scope (staff/manager) |
| **Realtime subscriptions** | `ws/requests/` staff/manager groups |
| **State ownership** | `useRequests` |

#### 4.3 Request detail (`/portal/staff/requests/:id`)

| Attribute | Value |
|-----------|-------|
| **Purpose** | View request; assign, cancel, create quote, review verification |
| **Visible roles** | `STAFF`, `MANAGER`, `SUPER_ADMIN` |
| **Layout** | `StaffPortalLayout` |
| **APIs consumed** | `GET /requests/{id}/`, `POST .../assign/`, `POST .../cancel/`, `POST .../quotes/`, `POST .../review/` |
| **Required permissions** | assign: `request.assign`; cancel: `request.cancel`; quote: `quote.create`; review: `verification.verify` |
| **Realtime subscriptions** | Per-request subscribe on `ws/requests/` |
| **State ownership** | `useRequest`, `useAssignRequest`, `useCreateQuote`, `useReviewVerification` |

#### 4.4 Assign technician (`/portal/staff/requests/:id/assign`)

| Attribute | Value |
|-----------|-------|
| **Purpose** | Bind technician to request |
| **Visible roles** | `STAFF`, `MANAGER`, `SUPER_ADMIN` |
| **Layout** | `StaffPortalLayout` |
| **APIs consumed** | `POST /api/v1/requests/{id}/assign/` |
| **Required permissions** | `request.assign` |
| **Realtime subscriptions** | Invalidate on `request.assigned` |
| **State ownership** | `useAssignRequest` mutation |

#### 4.5 Verification review (`/portal/staff/requests/:id/review`)

| Attribute | Value |
|-----------|-------|
| **Purpose** | Approve or reject technician verification submission |
| **Visible roles** | `STAFF`, `MANAGER`, `SUPER_ADMIN` |
| **Layout** | `StaffPortalLayout` |
| **APIs consumed** | `POST /api/v1/requests/{id}/review/` |
| **Required permissions** | `verification.verify` |
| **Realtime subscriptions** | Invalidate on `verification.approved`, `verification.rejected` |
| **State ownership** | `useReviewVerification` |

#### 4.6 Booking calendar (`/portal/staff/bookings`) — **FEATURE GATED**

| Attribute | Value |
|-----------|-------|
| **Purpose** | Organization booking list/calendar |
| **Visible roles** | `STAFF`, `MANAGER`, `SUPER_ADMIN` |
| **Layout** | `StaffPortalLayout` |
| **APIs consumed** | `GET /api/v1/bookings/` |
| **Required permissions** | Authenticated + org scope |
| **Gate** | `VITE_FEATURE_BOOKINGS` |

#### 4.7 Booking detail (`/portal/staff/bookings/:id`) — **FEATURE GATED**

| Attribute | Value |
|-----------|-------|
| **Purpose** | View booking; schedule, reschedule, report no-show |
| **Visible roles** | `STAFF`, `MANAGER`, `SUPER_ADMIN` |
| **Layout** | `StaffPortalLayout` |
| **APIs consumed** | `GET /bookings/{id}/`, `POST .../schedule/`, `POST .../reschedule/`, `POST .../no-show/` |
| **Required permissions** | schedule: `booking.schedule`; reschedule: `booking.reschedule`; no-show: `booking.no_show` |
| **Gate** | `VITE_FEATURE_BOOKINGS` |

#### 4.8 Product list (`/portal/staff/products`)

| Attribute | Value |
|-----------|-------|
| **Purpose** | Manage product catalog |
| **Visible roles** | `STAFF`, `MANAGER`, `SUPER_ADMIN` |
| **Layout** | `StaffPortalLayout` |
| **APIs consumed** | `GET /api/v1/products/` |
| **Required permissions** | `product.view` |
| **State ownership** | `useProducts` |

#### 4.9 Create product (`/portal/staff/products/new`)

| Attribute | Value |
|-----------|-------|
| **Purpose** | Add new product |
| **Visible roles** | `STAFF`, `MANAGER`, `SUPER_ADMIN` |
| **Layout** | `StaffPortalLayout` |
| **APIs consumed** | `POST /api/v1/products/` |
| **Required permissions** | `product.create` |
| **State ownership** | `useCreateProduct` |

#### 4.10 Edit product (`/portal/staff/products/:id`)

| Attribute | Value |
|-----------|-------|
| **Purpose** | Update product; adjust inventory |
| **Visible roles** | `STAFF`, `MANAGER`, `SUPER_ADMIN` |
| **Layout** | `StaffPortalLayout` |
| **APIs consumed** | `GET /products/{id}/`, `PATCH /products/{id}/`, `POST .../inventory-adjust/` |
| **Required permissions** | update: `product.update`; inventory: `inventory.adjust`; threshold: `inventory.manage` (manager+) |
| **State ownership** | `useProduct`, `useUpdateProduct`, `useAdjustInventory` |

#### 4.11 Categories (`/portal/staff/categories`)

| Attribute | Value |
|-----------|-------|
| **Purpose** | Manage product categories |
| **Visible roles** | `STAFF`, `MANAGER`, `SUPER_ADMIN` |
| **Layout** | `StaffPortalLayout` |
| **APIs consumed** | `GET/POST /categories/`, `PATCH /categories/{id}/`, `POST .../archive/` |
| **Required permissions** | view: `category.view`; create/update: `category.create`, `category.update`; archive: `category.archive` (manager+) |
| **State ownership** | `useCategories`, category mutations |

#### 4.12 Order queue (`/portal/staff/orders`)

| Attribute | Value |
|-----------|-------|
| **Purpose** | View and fulfill customer orders |
| **Visible roles** | `STAFF`, `MANAGER`, `SUPER_ADMIN` |
| **Layout** | `StaffPortalLayout` |
| **APIs consumed** | `GET /api/v1/orders/` |
| **Required permissions** | `order.view` |
| **Realtime subscriptions** | Future: `order.created` |
| **State ownership** | `useOrders` |

#### 4.13 Order detail (`/portal/staff/orders/:id`)

| Attribute | Value |
|-----------|-------|
| **Purpose** | Order detail; fulfill or cancel |
| **Visible roles** | `STAFF`, `MANAGER`, `SUPER_ADMIN` |
| **Layout** | `StaffPortalLayout` |
| **APIs consumed** | `GET /orders/{id}/`, `POST .../fulfill/`, `POST .../cancel/` |
| **Required permissions** | view: `order.view`; fulfill: `order.fulfill`; cancel: `order.cancel` (manager+ for restricted cases per backend rules) |
| **Realtime subscriptions** | Future: `order.fulfilled` |
| **State ownership** | `useOrder`, `useFulfillOrder` |

#### 4.14 Payment list (`/portal/staff/payments`)

| Attribute | Value |
|-----------|-------|
| **Purpose** | View all payments |
| **Visible roles** | `STAFF`, `MANAGER`, `SUPER_ADMIN` |
| **Layout** | `StaffPortalLayout` |
| **APIs consumed** | `GET /api/v1/payments/` |
| **Required permissions** | `payment.view` |
| **State ownership** | `usePayments` |

#### 4.15 Payment detail (`/portal/staff/payments/:id`)

| Attribute | Value |
|-----------|-------|
| **Page type** | API-backed |
| **Purpose** | View payment status; manager/superadmin may cancel eligible payments |
| **Visible roles** | `STAFF`, `MANAGER`, `SUPER_ADMIN` |
| **Layout** | `StaffPortalLayout` |
| **APIs consumed** | `GET /api/v1/payments/{id}/`, `POST /api/v1/payments/{id}/cancel/` |
| **Required permissions** | View: `payment.view`; cancel: `payment.cancel` (manager+, superadmin per `payments/permissions.py`) |
| **Realtime subscriptions** | Future: `payment.paid`, `payment.failed` |
| **State ownership** | `usePayment`, `useCancelPayment` |

---

### 5. Manager portal pages

Prefix: `/portal/manager`. Guard: `ManagerPortalGuard`. Inherits staff operations routes via `/portal/manager/operations/*` alias or shared nav.

#### 5.1 Manager dashboard (`/portal/manager`)

| Attribute | Value |
|-----------|-------|
| **Page type** | NavigationShellPage |
| **Purpose** | Manager home; escalations and inventory oversight entry |
| **Visible roles** | `MANAGER`, `SUPER_ADMIN` |
| **Layout** | `ManagerPortalLayout` |
| **APIs consumed** | `GET /api/v1/requests/`, `GET /api/v1/orders/`, `GET /api/v1/products/` (summary widgets) |
| **Required permissions** | `MANAGER` or `SUPER_ADMIN` role |
| **Realtime subscriptions** | `ws/requests/` manager group; `sla.breached`, `escalation.triggered` |

#### 5.2 Escalation queue (`/portal/manager/escalations`)

| Attribute | Value |
|-----------|-------|
| **Purpose** | View and resolve escalated requests |
| **Visible roles** | `MANAGER`, `SUPER_ADMIN` |
| **Layout** | `ManagerPortalLayout` |
| **APIs consumed** | `GET /api/v1/requests/` (filtered by escalation state) |
| **Required permissions** | Authenticated manager scope; escalate action: `request.escalate`; resolve: `escalation.resolve` |
| **Realtime subscriptions** | `escalation.triggered`, `sla.breached` |

#### 5.3 Escalate request (`/portal/manager/requests/:id/escalate`)

| Attribute | Value |
|-----------|-------|
| **Purpose** | Escalate request to manager queue |
| **Visible roles** | `MANAGER`, `SUPER_ADMIN` |
| **Layout** | `ManagerPortalLayout` |
| **APIs consumed** | `POST /api/v1/requests/{id}/escalate/` |
| **Required permissions** | `request.escalate` |
| **State ownership** | `useEscalateRequest` |

#### 5.4 Inventory overview (`/portal/manager/inventory`)

| Attribute | Value |
|-----------|-------|
| **Purpose** | Inventory levels; adjust stock; archive products |
| **Visible roles** | `MANAGER`, `SUPER_ADMIN` |
| **Layout** | `ManagerPortalLayout` |
| **APIs consumed** | `GET /products/`, `POST .../inventory-adjust/`, `POST .../archive/` |
| **Required permissions** | `inventory.manage`, `product.archive`, `category.archive` |
| **State ownership** | `useProducts`, `useAdjustInventory`, `useArchiveProduct` |

#### 5.5 Audit log viewer (`/portal/manager/audit-logs`)

| Attribute | Value |
|-----------|-------|
| **Purpose** | Search and view audit entries |
| **Visible roles** | `MANAGER`, `SUPER_ADMIN` |
| **Layout** | `ManagerPortalLayout` |
| **APIs consumed** | `GET /api/v1/audit-logs/` |
| **Required permissions** | `audit.view` |
| **State ownership** | `useAuditLogs` → `['audit-logs']` |

#### 5.6 Technician availability (`/portal/manager/technicians/:id/availability`) — **FEATURE GATED**

| Attribute | Value |
|-----------|-------|
| **Purpose** | View technician calendar availability for scheduling |
| **Visible roles** | `MANAGER`, `SUPER_ADMIN` |
| **Layout** | `ManagerPortalLayout` |
| **APIs consumed** | `GET /api/v1/technicians/{id}/availability/` |
| **Required permissions** | Staff+ internal access |
| **Gate** | `VITE_FEATURE_BOOKINGS` |

---

### 6. Admin portal pages

Prefix: `/portal/admin`. Guard: `AdminPortalGuard` (`SUPER_ADMIN` only).

**Excluded:** `/portal/admin/users` and `/portal/admin/roles` — no REST API mounted.

#### 6.1 Admin dashboard (`/portal/admin`)

| Attribute | Value |
|-----------|-------|
| **Page type** | NavigationShellPage |
| **Purpose** | Platform admin home; links to audit and system health |
| **Visible roles** | `SUPER_ADMIN` |
| **Layout** | `AdminPortalLayout` |
| **APIs consumed** | Navigation only on load; child routes consume `GET /api/v1/audit-logs/`, `GET /health/` |
| **Required permissions** | `SUPER_ADMIN` role |
| **Realtime subscriptions** | `ws/requests/` manager group |

#### 6.2 Audit logs (`/portal/admin/audit-logs`)

| Attribute | Value |
|-----------|-------|
| **Purpose** | Full audit log access |
| **Visible roles** | `SUPER_ADMIN` |
| **Layout** | `AdminPortalLayout` |
| **APIs consumed** | `GET /api/v1/audit-logs/` |
| **Required permissions** | `audit.view` |
| **State ownership** | `useAuditLogs` |

#### 6.3 Audit export (`/portal/admin/audit-logs/export`)

| Attribute | Value |
|-----------|-------|
| **Purpose** | Export audit log data |
| **Visible roles** | `SUPER_ADMIN` |
| **Layout** | `AdminPortalLayout` |
| **APIs consumed** | `GET /api/v1/audit-logs/export/` |
| **Required permissions** | `audit.view` |
| **State ownership** | `useExportAuditLogs` |

#### 6.4 System health (`/portal/admin/system`)

| Attribute | Value |
|-----------|-------|
| **Purpose** | Display API health and optional OpenAPI schema link |
| **Visible roles** | `SUPER_ADMIN` |
| **Layout** | `AdminPortalLayout` |
| **APIs consumed** | `GET /health/`; `GET /api/v1/schema/swagger-ui/` (if `ENABLE_SPECTACULAR`) |
| **Required permissions** | `SUPER_ADMIN` role |
| **Realtime subscriptions** | `ws/system/` handshake optional |

---

### 7. Shared UI ownership

| UI element | Owner | Used on |
|------------|-------|---------|
| `Layout`, `Hero`, Navbar, Footer | `shared-packages/design-system` | Public pages |
| Button, Card, Form, Input, Table, Modal | `shared-packages/design-system` | All portals |
| Portal sidebars / nav | `web/src/layouts/` | Portal pages |
| `PermissionGate` | `web/src/components/auth/` | Action buttons, route guards |
| Toast / notification banner | `web/src/components/` (tokens from design-system) | All authenticated pages |
| Breadcrumbs | `web/src/components/` | Staff, Manager, Admin detail pages |

---

## Dependencies

- [frontend-architecture.md](frontend-architecture.md)
- [frontend-routing.md](frontend-routing.md)
- [frontend-state-management.md](frontend-state-management.md)
- [frontend-api-integration.md](frontend-api-integration.md)
- [frontend-design-system.md](frontend-design-system.md)
- [frontend-authentication.md](frontend-authentication.md)
- [frontend-realtime-strategy.md](frontend-realtime-strategy.md)
- Backend: `docs/implementation/{domain}/*-api-design.md`, `apps/requests/permissions/matrix.py`

## Open Questions

- UNRESOLVED — Order/payment WebSocket channel naming when Phase 6 broadcaster ships ([order-websocket-spec.md](../implementation/order/order-websocket-spec.md)).
- UNRESOLVED — Notifications REST contract when `apps/notifications/` is implemented.
- UNRESOLVED — Whether manager uses `/portal/manager/operations/*` alias or direct `/portal/staff/*` links for shared staff pages.

## Completion Criteria

- [ ] Every page declares a Page type (API-backed, StaticContentPage, ClientOnlyPage, or NavigationShellPage).
- [ ] No page references an API endpoint absent from backend URL config (except feature-gated bookings/notifications).
- [ ] Admin users/roles routes removed until REST APIs mount.
- [ ] Staff payment detail and mobile payment list documented.
- [ ] All portal pages use design-system tokens; public home uses Layout + Hero.
