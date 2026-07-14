# RBAC UI Mapping

## Purpose

Map backend permission codenames and role boundaries to visible/hidden UI, route access, and component-level action visibility across web and mobile surfaces.

**Server enforces all authorization.** This document governs client UX only.

## Scope

- Roles: Customer, Technician, Staff, Manager, Superadmin
- Navigation visibility
- Dashboard widget visibility
- Action button visibility
- Route access per portal
- Component-level `PermissionGate` mappings

## Out of Scope

- Django permission class implementation
- New permission codenames not in backend
- Admin user/role management UI (no REST API mounted)
- Webhook or SYSTEM-only permissions in UI (`webhook.process`)
- Visual design or wireframes

## Definitions

| Term | Definition |
|------|------------|
| **Role** | Coarse `User.role` from login: `CUSTOMER`, `TECHNICIAN`, `STAFF`, `MANAGER`, `SUPER_ADMIN` |
| **Permission** | String codename e.g. `request.assign` from backend matrices |
| **Ownership scope** | Service-layer filter: owned, assigned, or global — applies to list/retrieve without separate codename (requests) |
| **Visible UI** | Nav item, route, or button rendered |
| **Hidden UI** | Not rendered (preferred over disabled for unauthorized actions) |
| **isStaffPlus** | `STAFF`, `MANAGER`, or `SUPER_ADMIN` |
| **Feature gate** | UI hidden when backend API not mounted (bookings, notifications) |

### Permission sources (authoritative)

| Domain | Source |
|--------|--------|
| Requests | `backend/apps/requests/permissions/matrix.py`, `constants.py` |
| Orders | `docs/implementation/order/order-permission-mapping.md` |
| Products | `docs/implementation/product/product-permission-mapping.md` |
| Payments | `backend/apps/payments/permissions.py` |
| Bookings | `docs/implementation/booking/booking-permission-mapping.md`, `apps/bookings/permissions/constants.py` |
| Audit / WebSocket | `audit.view`, `websocket.connect` (data-driven RBAC, seeded) |

---

## Detailed Sections

### 1. Role → surface access

| Role | Web surfaces | Mobile surfaces |
|------|--------------|-----------------|
| **Customer** | Public + `/portal/customer/*` | `(customer)/*` |
| **Technician** | Public + `/login` only (no portal in Phase 6) | `(technician)/*` |
| **Staff** | Public + `/portal/staff/*` | None — redirect to web |
| **Manager** | Public + `/portal/staff/*` + `/portal/manager/*` | None — redirect to web |
| **Superadmin** | Public + staff + manager + `/portal/admin/*` | None — redirect to web |

---

### 2. Request permissions → UI

From `apps/requests/permissions/matrix.py`:

| Permission | Customer | Technician | Staff | Manager | Superadmin |
|------------|----------|------------|-------|---------|------------|
| `request.create` | yes | — | — | — | — |
| `request.submit` | yes | — | — | — | — |
| `request.cancel` | yes (owned, pre-active) | — | yes | yes | — |
| `request.cancel_active` | — | — | — | yes | — |
| `quote.approve` | yes | — | — | — | — |
| `quote.reject` | yes | — | — | — | — |
| `quote.revise` | yes | — | — | — | — |
| `assignment.accept` | — | yes (assigned) | — | — | — |
| `assignment.decline` | — | yes (assigned) | — | — | — |
| `request.update` | — | yes (assigned) | — | — | — |
| `quote.create` | — | yes (assigned) | yes | — | — |
| `verification.submit` | — | yes (assigned) | — | — | — |
| `request.triage` | — | — | yes | — | — |
| `request.assign` | — | — | yes | — | — |
| `verification.verify` | — | — | yes | — | — |
| `request.escalate` | — | — | — | yes | — |
| `escalation.resolve` | — | — | — | yes | — |
| `verification.override` | — | — | — | yes | — |
| `system.override` | — | — | — | — | yes |

**List/retrieve requests:** Authenticated + ownership scope (no matrix codename). All roles with request access see list UI; data filtered server-side.

---

### 3. Order permissions → UI

| Permission | Customer | Technician | Staff | Manager | Superadmin |
|------------|----------|------------|-------|---------|------------|
| `order.create` | yes | — | — | — | — |
| `order.view_own` | yes | — | — | — | — |
| `order.view` | — | — | yes | yes | yes |
| `order.cancel` | yes (own) | — | — | yes | yes |
| `order.fulfill` | — | — | yes | yes | yes |
| `order.override_fulfillment` | — | — | — | yes | yes |

---

### 4. Product permissions → UI

| Permission | Customer | Technician | Staff | Manager | Superadmin |
|------------|----------|------------|-------|---------|------------|
| `product.view` | yes | — | yes | yes | yes |
| `product.create` | — | — | yes | yes | yes |
| `product.update` | — | — | yes | yes | yes |
| `product.archive` | — | — | — | yes | yes |
| `category.view` | yes | — | yes | yes | yes |
| `category.create` | — | — | yes | yes | yes |
| `category.update` | — | — | yes | yes | yes |
| `category.archive` | — | — | — | yes | yes |
| `inventory.view` | — | — | yes | yes | yes |
| `inventory.adjust` | — | — | yes | yes | yes |
| `inventory.manage` | — | — | — | yes | yes |

---

### 5. Payment permissions → UI

From `backend/apps/payments/permissions.py`:

| Permission | Customer | Technician | Staff | Manager | Superadmin |
|------------|----------|------------|-------|---------|------------|
| `payment.initialize` | yes | — | — | — | yes |
| `payment.view_own` | yes | — | — | — | — |
| `payment.view` | — | — | yes | yes | yes |
| `payment.cancel` | yes (own, not paid) | — | — | yes | yes |
| `payment.reconcile` | — | — | — | yes | yes |
| `webhook.view` | — | — | yes | yes | yes |

`webhook.process` is SYSTEM only — no UI.

---

### 6. Booking permissions → UI (FEATURE GATED)

| Permission | Customer | Technician | Staff | Manager | Superadmin |
|------------|----------|------------|-------|---------|------------|
| `booking.schedule` | — | — | yes | yes | yes |
| `booking.reschedule` | yes (own) | yes (assigned) | yes | yes | yes |
| `booking.extend` | — | yes (assigned) | — | — | — |
| `booking.no_show` | — | yes (assigned) | yes | yes | yes |
| `calendar.view` | yes (own context) | yes (own) | yes (all) | yes (all) | yes |
| `calendar.manage_hours` | — | yes (self) | — | yes | yes |
| `calendar.manage_blackouts` | — | yes (self) | — | yes | yes |

`booking.create` is SYSTEM only — no UI.

---

### 7. Platform permissions → UI

| Permission | Customer | Technician | Staff | Manager | Superadmin |
|------------|----------|------------|-------|---------|------------|
| `audit.view` | — | — | — | yes | yes |
| `websocket.connect` | if granted | if granted | if granted | if granted | if granted |

`websocket.connect` is data-driven via `UserRole` assignments; UI connects when login succeeds and permission evaluates true.

---

### 8. Navigation visibility matrix

#### 8.1 Web — Customer portal nav

| Nav item | Route | Visible roles | Required permission / condition |
|----------|-------|---------------|--------------------------------|
| Dashboard | `/portal/customer` | Customer | Authenticated `CUSTOMER` |
| Requests | `/portal/customer/requests` | Customer | Auth + ownership list |
| Shop | `/portal/customer/shop` | Customer | `product.view` |
| Cart | `/portal/customer/cart` | Customer | Authenticated |
| Orders | `/portal/customer/orders` | Customer | `order.view_own` |
| Payments | `/portal/customer/payments` | Customer | `payment.view_own` |
| Payment history (mobile) | `(customer)/payments/index` | Customer | `payment.view_own` |
| Bookings | `/portal/customer/bookings` | Customer | Feature gate + auth |
| Notifications | `/portal/customer/notifications` | Customer | Feature gate + auth |
| Settings | `/portal/customer/settings` | Customer | Authenticated |

**Hidden from customer:** Staff, manager, admin nav; assign, fulfill, inventory, audit.

#### 8.2 Web — Staff portal nav

| Nav item | Route | Visible roles | Required permission |
|----------|-------|---------------|---------------------|
| Dashboard | `/portal/staff` | Staff+ | `isStaffPlus` |
| Requests | `/portal/staff/requests` | Staff+ | Auth + global list |
| Bookings | `/portal/staff/bookings` | Staff+ | Feature gate |
| Products | `/portal/staff/products` | Staff+ | `product.view` |
| Categories | `/portal/staff/categories` | Staff+ | `category.view` |
| Orders | `/portal/staff/orders` | Staff+ | `order.view` |
| Payments | `/portal/staff/payments` | Staff+ | `payment.view` |
| Payment detail | `/portal/staff/payments/:id` | Staff+ | `payment.view`; cancel: manager+ |

**Hidden from staff:** Manager escalations, audit (unless manager+), admin system, customer shop/cart.

#### 8.3 Web — Manager portal nav (additional)

| Nav item | Route | Visible roles | Required permission |
|----------|-------|---------------|---------------------|
| Manager dashboard | `/portal/manager` | Manager, Superadmin | Manager role |
| Escalations | `/portal/manager/escalations` | Manager, Superadmin | `request.escalate` |
| Inventory | `/portal/manager/inventory` | Manager, Superadmin | `inventory.manage` |
| Audit logs | `/portal/manager/audit-logs` | Manager, Superadmin | `audit.view` |
| Operations (alias) | `/portal/manager/operations/*` | Manager, Superadmin | Staff nav permissions |

#### 8.4 Web — Admin portal nav

| Nav item | Route | Visible roles | Required permission |
|----------|-------|---------------|---------------------|
| Admin dashboard | `/portal/admin` | Superadmin | `SUPER_ADMIN` |
| Audit logs | `/portal/admin/audit-logs` | Superadmin | `audit.view` |
| Audit export | `/portal/admin/audit-logs/export` | Superadmin | `audit.view` |
| System | `/portal/admin/system` | Superadmin | `SUPER_ADMIN` |

**Hidden — no API:** Users, Roles management nav items.

#### 8.5 Mobile — Customer tabs

| Tab | Visible roles | Hidden from |
|-----|---------------|-------------|
| Home | Customer | Technician, staff+ |
| Requests | Customer | — |
| Shop | Customer | — |
| Orders | Customer | — |
| Account | Customer | — |

Stack: `payments/index` (payment history), bookings, notifications — bookings/notifications feature gated.

#### 8.6 Mobile — Technician tabs

| Tab | Visible roles | Hidden from |
|-----|---------------|-------------|
| Jobs | Technician | Customer, staff+ |
| Schedule | Technician | Feature gate |
| Availability | Technician | Feature gate |
| Account | Technician | — |

---

### 9. Dashboard visibility matrix

Widgets shown only when underlying read permission exists.

#### 9.1 Customer dashboard (web + mobile home)

| Widget | Visible | Hidden | Permission / source |
|--------|---------|--------|---------------------|
| Open requests summary | yes | — | Auth + `GET /requests/` |
| Recent orders | yes | — | `order.view_own` |
| Shop featured products | yes | — | `product.view` |
| Pending payments | yes | — | `payment.view_own` |
| Staff request queue | — | yes | Staff only |
| Escalation alerts | — | yes | Manager only |
| Audit summary | — | yes | `audit.view` |

#### 9.2 Staff dashboard

| Widget | Visible | Hidden | Permission |
|--------|---------|--------|------------|
| Request queue count | yes | — | Auth + global requests |
| Orders awaiting fulfillment | yes | — | `order.view` |
| Low stock alerts | yes | — | `inventory.view` |
| Escalation queue | — | yes (staff) | Manager: yes via manager dashboard |
| Audit log preview | — | yes (staff) | Manager+: `audit.view` |

#### 9.3 Manager dashboard

| Widget | Visible | Hidden | Permission |
|--------|---------|--------|------------|
| All staff widgets | yes | — | Inherited |
| Escalation count | yes | — | `request.escalate` / escalation state |
| SLA breach alerts | yes | — | WS `sla.breached` |
| Inventory overview | yes | — | `inventory.manage` |
| Audit preview | yes | — | `audit.view` |

#### 9.4 Admin dashboard

| Widget | Visible | Hidden | Permission |
|--------|---------|--------|------------|
| System health | yes | — | `SUPER_ADMIN` |
| Audit link | yes | — | `audit.view` |
| User management | — | yes | No API |
| Role management | — | yes | No API |

#### 9.5 Technician mobile home (jobs tab default)

| Widget | Visible | Hidden | Permission |
|--------|---------|--------|------------|
| Assigned jobs list | yes | — | Auth + assigned scope |
| Accept/decline actions | yes | — | `assignment.accept`, `assignment.decline` |
| Shop / orders | — | yes | Customer only |

---

### 10. Action button visibility matrix

Format: **Permission → Visible UI → Hidden UI → Route → Component**

#### 10.1 Customer actions

| Permission | Visible UI | Hidden UI | Route access | Component |
|------------|------------|-----------|--------------|-----------|
| `request.create` | "New request" button | — | `/portal/customer/requests/new`, mobile `requests/new` | `CreateRequestButton` |
| `request.submit` | "Submit" on draft | Submit on non-draft | Request detail | `SubmitRequestButton` |
| `request.cancel` | "Cancel" (pre-active) | Cancel after active | Request detail | `CancelRequestButton` |
| `quote.approve` | "Approve quote" | — | Request detail quotes | `ApproveQuoteButton` |
| `quote.reject` | "Reject quote" | — | Request detail quotes | `RejectQuoteButton` |
| `quote.revise` | "Request revision" | — | Request detail quotes | `ReviseQuoteButton` |
| `order.create` | "Checkout" | — | Checkout | `CheckoutButton` |
| `order.cancel` | "Cancel order" | Cancel paid orders | Order detail | `CancelOrderButton` |
| `payment.initialize` | "Pay now" | — | Checkout | `PayButton` |
| `payment.view_own` | Payment history link | — | customer payments; mobile `payments/index` | — |
| `payment.cancel` | "Cancel payment" | Cancel paid | Payment detail (customer) | `CancelPaymentButton` |
| `booking.reschedule` | "Reschedule" (gated) | — | Booking detail | `RescheduleBookingButton` |

#### 10.2 Technician actions (mobile)

| Permission | Visible UI | Hidden UI | Route | Component |
|------------|------------|-----------|-------|-----------|
| `assignment.accept` | "Accept" | — | Job detail | `AcceptAssignmentButton` |
| `assignment.decline` | "Decline" | — | Job detail | `DeclineAssignmentButton` |
| `request.update` | "Update request" | — | Job detail | `UpdateRequestButton` |
| `quote.create` | "Create quote" | — | `jobs/[id]/quote` | `CreateQuoteButton` |
| `verification.submit` | "Submit verification" | — | `jobs/[id]/verify` | `SubmitVerificationButton` |
| `booking.reschedule` | "Reschedule" (gated) | — | schedule/[id] | `RescheduleBookingButton` |
| `booking.extend` | "Extend" (gated) | — | schedule/[id] | `ExtendBookingButton` |
| `booking.no_show` | "Report no-show" (gated) | — | schedule/[id] | `NoShowButton` |
| `calendar.manage_hours` | "Edit hours" (gated) | — | availability tab | `WorkingHoursForm` |
| `calendar.manage_blackouts` | "Add blackout" (gated) | — | availability tab | `BlackoutForm` |

#### 10.3 Staff actions (web)

| Permission | Visible UI | Hidden UI | Route | Component |
|------------|------------|-----------|-------|-----------|
| `request.assign` | "Assign technician" | — | staff assign | `AssignRequestButton` |
| `request.cancel` | "Cancel request" | — | staff request detail | `CancelRequestButton` |
| `quote.create` | "Create quote" | — | staff request detail | `CreateQuoteButton` |
| `verification.verify` | "Approve/Reject verification" | — | staff review | `ReviewVerificationButton` |
| `booking.schedule` | "Schedule" (gated) | — | staff booking schedule | `ScheduleBookingButton` |
| `booking.reschedule` | "Reschedule" (gated) | — | staff booking detail | `RescheduleBookingButton` |
| `booking.no_show` | "No-show" (gated) | — | staff booking detail | `NoShowButton` |
| `product.create` | "New product" | — | products/new | `CreateProductButton` |
| `product.update` | "Save" | — | products/:id | `SaveProductButton` |
| `inventory.adjust` | "Adjust inventory" | — | products/:id | `AdjustInventoryButton` |
| `category.create` | "New category" | — | categories | `CreateCategoryButton` |
| `category.update` | "Save category" | — | categories | `SaveCategoryButton` |
| `order.fulfill` | "Fulfill order" | — | staff order detail | `FulfillOrderButton` |
| `order.view` | View all orders | — | staff orders | — |
| `payment.view` | View all payments | — | staff payments, staff payment detail | — |

**Hidden from staff:** `product.archive`, `category.archive`, `inventory.manage`, `order.override_fulfillment`, `payment.reconcile`, `payment.cancel`, `request.escalate`, `verification.override`.

#### 10.4 Manager actions (web, additional to staff)

| Permission | Visible UI | Hidden UI | Route | Component |
|------------|------------|-----------|-------|-----------|
| `request.escalate` | "Escalate" | — | manager escalate | `EscalateRequestButton` |
| `escalation.resolve` | "Resolve escalation" | — | escalations | `ResolveEscalationButton` |
| `verification.override` | "Override verification" | — | request detail | `OverrideVerificationButton` |
| `request.cancel_active` | "Cancel active request" | — | request detail | `CancelActiveRequestButton` |
| `product.archive` | "Archive product" | — | inventory | `ArchiveProductButton` |
| `category.archive` | "Archive category" | — | categories | `ArchiveCategoryButton` |
| `inventory.manage` | Inventory threshold controls | — | inventory | `InventoryThresholdControl` |
| `order.cancel` | Cancel (elevated cases) | — | order detail | `CancelOrderButton` |
| `payment.cancel` | "Cancel payment" | — | staff payment detail | `CancelPaymentButton` |
| `payment.reconcile` | "Reconcile" | — | payments (future) | `ReconcileButton` |
| `audit.view` | Audit nav + export | — | audit-logs | `AuditLogTable` |

#### 10.5 Superadmin actions (web, additional to manager)

| Permission | Visible UI | Hidden UI | Route | Component |
|------------|------------|-----------|-------|-----------|
| `system.override` | System override controls | — | Admin surfaces | `SystemOverrideGate` |
| `SUPER_ADMIN` role | Admin portal nav | — | `/portal/admin/*` | `AdminPortalGuard` |
| `payment.initialize` | Initialize on behalf | — | Admin payment tools (if exposed) | — |

**Hidden — no API:** User CRUD, Role assignment UI.

---

### 11. Route access summary

| Route prefix | Customer | Technician | Staff | Manager | Superadmin |
|--------------|----------|------------|-------|---------|------------|
| `/` (public) | yes | yes | yes | yes | yes |
| `/login` | yes | yes | yes | yes | yes |
| `/portal/customer/*` | yes | no | no | no | no |
| `/portal/staff/*` | no | no | yes | yes | yes |
| `/portal/manager/*` | no | no | no | yes | yes |
| `/portal/admin/*` | no | no | no | no | yes |
| Mobile `(customer)/*` | yes | no | no | no | no |
| Mobile `(technician)/*` | no | yes | no | no | no |

Unauthorized route access: redirect to role home or `/403` (web); mobile login or role home.

---

### 12. Component access patterns

| Pattern | Usage |
|---------|-------|
| `RoleRoute` | Portal prefix guards |
| `PermissionGate` | Wraps action buttons and destructive controls |
| `hasPermission(user, codename)` | Conditional render in components |
| `isStaffPlus(user)` | Staff portal entry |
| Feature flag wrapper | Bookings and notifications routes |
| API 404 | Detail pages — show not-found (IDOR masking) |

**Forbidden UI patterns:**

- Show "Mark as paid" (no such permission or endpoint)
- Show "Create booking" (SYSTEM only)
- Show webhook admin to any human role
- Enable staff to archive products (`product.archive` is manager+)

---

## Dependencies

- [frontend-authentication.md](frontend-authentication.md)
- [frontend-routing.md](frontend-routing.md)
- [web-app-architecture.md](web-app-architecture.md)
- [mobile-app-architecture.md](mobile-app-architecture.md)
- [../architecture/auth.md](../architecture/auth.md)
- `backend/apps/requests/permissions/matrix.py`
- `docs/implementation/*/permission-mapping.md`

## Open Questions

- UNRESOLVED — Whether `websocket.connect` is granted by default to all authenticated roles or requires explicit `UserRole` assignment in production data.
- UNRESOLVED — `payment.reconcile` UI scope (no dedicated endpoint documented in API design).
- UNRESOLVED — `order.override_fulfillment` — no dedicated API endpoint in order API design; UI must not expose until endpoint exists.

## Completion Criteria

- [ ] Every permission codename in UI maps to a backend-defined codename.
- [ ] No UI exposes actions without a corresponding mounted API endpoint.
- [ ] Navigation, dashboard, and action matrices cover all Phase 6 portals.
- [ ] Admin users/roles UI excluded until REST APIs mount.
- [ ] Feature-gated booking/notification UI documented consistently with flags.
