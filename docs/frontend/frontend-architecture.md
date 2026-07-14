# Frontend Architecture

## Purpose

Define the monorepo frontend foundation for Entercom: how `web/`, `mobile/`, and `shared-packages/` relate, what each surface owns, and where cross-cutting concerns (API, auth, notifications, WebSocket) live.

This document is authoritative for Phase 6 implementation. It does not redesign UI; it extends the existing company website design into portal surfaces.

## Related documentation

- [frontend-routing.md](frontend-routing.md) — route maps per portal
- [frontend-state-management.md](frontend-state-management.md) — state ownership
- [frontend-api-integration.md](frontend-api-integration.md) — endpoint and hook mapping
- [frontend-design-system.md](frontend-design-system.md) — tokens and components from existing design
- [frontend-authentication.md](frontend-authentication.md) — auth flows
- [frontend-realtime-strategy.md](frontend-realtime-strategy.md) — WebSocket consumption
- [frontend-testing-strategy.md](frontend-testing-strategy.md) — test layers
- [../architecture/frontend.md](../architecture/frontend.md) — platform principles
- [../architecture/auth.md](../architecture/auth.md) — RBAC and JWT

---

## Monorepo structure

```
entercom/
├── backend/                  # Django + DRF + Channels (source of truth)
├── web/                      # React + Vite + TypeScript (customer + internal portals)
├── mobile/                   # Expo + React Native (customer + technician)
├── shared-packages/          # Cross-platform contracts and UI primitives
│   ├── types/                # DTOs aligned with /api/v1/
│   ├── api-client/           # HTTP client, interceptors, base path
│   ├── validation/           # Zod schemas mirroring backend validation
│   ├── auth/                 # Token storage interface, role helpers
│   ├── websocket/            # Event envelope types, connection contract
│   ├── utils/                # Shared non-UI helpers
│   └── design-system/        # Tokens, Layout, Hero, Tailwind config, primitives
└── docs/frontend/            # This documentation set
```

### Dependency direction

```
web/  ──────┐
            ├──► shared-packages/*  ──► backend OpenAPI / docs (read-only contract)
mobile/ ────┘
```

- `web/` and `mobile/` **must not** import from each other.
- Both import from `shared-packages/` only.
- `shared-packages/` has **no** dependency on `web/` or `mobile/`.

---

## Shared packages

| Package | Responsibility | Consumers |
|---------|----------------|-----------|
| `shared-packages/types` | Request, booking, product, order, payment, notification, auth DTOs | api-client, web, mobile |
| `shared-packages/api-client` | Base HTTP client, `/api/v1/` prefix, auth header injection, error normalization | web hooks, mobile hooks |
| `shared-packages/validation` | Input schemas for forms (create request, checkout, etc.) | web forms, mobile forms |
| `shared-packages/auth` | Role normalization, permission codename constants, session types | web guards, mobile guards |
| `shared-packages/websocket` | Event envelope type, event name constants, reconnect policy interface | web WS service, mobile WS service |
| `shared-packages/utils` | Date formatting, currency, pagination helpers | all surfaces |
| `shared-packages/design-system` | CSS tokens (`index.css`), Tailwind config, Layout, Hero, primitives | web (direct), mobile (token mapping only) |

### Design system placement

The existing company website design is authoritative. These assets live in `shared-packages/design-system/`:

- `tokens/index.css` — CSS custom properties (source: `web/src/index.css`)
- `tailwind.config.js` — Tailwind theme extension from company site
- `components/Layout/` — site shell (header, footer, content area)
- `components/Hero/` — marketing hero section
- `components/` — buttons, cards, forms, tables, modals (extracted, not redesigned)

`web/` re-exports or imports from `shared-packages/design-system`. No duplicate token definitions in `web/`.

---

## Web app boundaries

**Stack:** React 19, TypeScript (strict), Vite, React Router, TanStack Query, Tailwind (via design-system), Zustand (ephemeral UI only).

**Owns:**

| Concern | Location | Notes |
|---------|----------|-------|
| Routing | `web/src/routes/` | Four portal route trees (see routing doc) |
| Page components | `web/src/pages/` | Feature pages per portal |
| Feature modules | `web/src/features/{domain}/` | requests, bookings, products, orders, payments, notifications |
| Portal layouts | `web/src/layouts/` | Customer, Staff, Manager, Admin shells |
| Web-specific UI | `web/src/components/` | Compositions not shared with mobile |
| Web WebSocket service | `web/src/services/websocket/` | Single connection manager per tab |
| Web auth bootstrap | `web/src/providers/AuthProvider.tsx` | Wraps shared auth + web storage |

**Does not own:**

- HTTP transport implementation → `shared-packages/api-client`
- DTO types → `shared-packages/types`
- Permission codenames → `shared-packages/auth`
- Design tokens → `shared-packages/design-system`

**Portal surfaces (web only):**

| Portal | Roles | Primary domains |
|--------|-------|-----------------|
| Customer | `CUSTOMER` | Requests, bookings (view), products (browse), orders, payments |
| Staff | `STAFF` | Request triage, products, orders (fulfill), bookings (schedule) |
| Manager | `MANAGER` | Escalations, approvals, inventory oversight, audit |
| Admin | `SUPER_ADMIN` | Platform config, user/role management (when API available) |

Technician primary workflows are **mobile-first**; limited technician views on web are optional and secondary.

---

## Mobile app boundaries

**Stack:** Expo 54, React Native, Expo Router, TanStack Query, Zustand (ephemeral UI only).

**Owns:**

| Concern | Location | Notes |
|---------|----------|-------|
| Navigation | `mobile/app/` (Expo Router) | Tab + stack per role |
| Screens | `mobile/src/screens/` | Customer and technician flows |
| Mobile-specific UI | `mobile/src/components/` | Native patterns (not web Layout/Hero) |
| Push notification registration | `mobile/src/services/push/` | Device token lifecycle |
| Mobile WebSocket service | `mobile/src/services/websocket/` | Single connection per app session |
| Offline queue (future) | `mobile/src/services/offline/` | See architecture/offline-sync.md |

**Does not own:**

- API client, types, validation → `shared-packages/`
- Auth token logic → `shared-packages/auth` (mobile provides secure storage adapter)
- Web marketing pages (Layout, Hero) → web + design-system only

**Role surfaces (mobile):**

| Role | Primary flows |
|------|---------------|
| `CUSTOMER` | Login, requests, bookings, orders, payments, notifications |
| `TECHNICIAN` | Assignments, accept/decline, verification, booking schedule, availability |

Staff, Manager, and Admin portals are **web-only** in Phase 6.

---

## API client ownership

| Layer | Owner | Responsibility |
|-------|-------|----------------|
| Base client | `shared-packages/api-client` | `fetch` wrapper, `/api/v1/` base URL, JSON parsing, 401 → refresh trigger |
| Auth interceptor | `shared-packages/api-client` | Attach `Authorization: Bearer <access>` |
| Error envelope | `shared-packages/api-client` | Normalize requests API `{ success, message, data }` vs raw DRF responses |
| Domain API functions | `shared-packages/api-client/src/{domain}/` | Thin functions per endpoint (no React) |
| React Query hooks | `web/src/features/{domain}/hooks/`, `mobile/src/features/{domain}/hooks/` | `useQuery` / `useMutation` wrappers per surface |
| Query client instance | Each app (`web/src/lib/queryClient.ts`, `mobile/src/lib/queryClient.ts`) | App-level defaults; shared invalidation keys in `shared-packages/api-client/src/queryKeys.ts` |

**Rule:** Hooks call domain API functions; domain API functions call base client. Pages never call `fetch` directly.

---

## Authentication ownership

| Concern | Owner |
|---------|-------|
| Login / logout / refresh API calls | `shared-packages/api-client/src/auth/` |
| Token storage interface | `shared-packages/auth` |
| Web token storage (memory + httpOnly consideration) | `web/src/services/auth/storage.ts` implements shared interface |
| Mobile token storage (SecureStore) | `mobile/src/services/auth/storage.ts` implements shared interface |
| Auth context / provider | Each app (`AuthProvider`) using `shared-packages/auth` |
| Route guards | Each app (`ProtectedRoute`, `RoleRoute`) |
| Permission checks for UI | `shared-packages/auth` helpers; apps render/hide only |

Server always enforces permissions. Client checks are for UX only.

See [frontend-authentication.md](frontend-authentication.md).

---

## Notification ownership

| Layer | Owner | Responsibility |
|-------|-------|----------------|
| Notification DTO types | `shared-packages/types` | Inbox item, read state |
| REST hooks (when API ships) | `shared-packages/api-client` + app hooks | List, mark read |
| In-app notification state | Each app Zustand slice | Toast queue, unread badge, drawer open |
| WebSocket `notify.*` handler | Each app WS service | Parse envelope → update notification store + invalidate queries |
| Push (mobile) | `mobile/src/services/push/` | Register token, handle cold start |
| Toast / banner UI | Each app components | Uses design-system tokens |

**Phase 6 note:** Notification REST API is not yet mounted on backend. Frontend defines contracts and store shape; REST integration is gated on backend `apps/notifications/`.

---

## WebSocket ownership

| Layer | Owner | Responsibility |
|-------|-------|----------------|
| Event envelope types | `shared-packages/websocket` | `{ event, version, timestamp, payload }` |
| Event name constants | `shared-packages/websocket` | `request.*`, `order.*`, `payment.*`, `notification.*` |
| Connection manager | Each app (`services/websocket/`) | Connect, reconnect, heartbeat, role_version close handling |
| Subscription API | Each app WS service | e.g. `{ action: "subscribe", request_id }` for requests |
| Event → state mapping | Each app `services/websocket/handlers/` | Invalidate React Query keys, patch Zustand slices |
| UI subscriptions | Feature hooks | `useRequestRealtime(requestId)` delegates to WS service |

**Rule:** One WebSocket connection per app session (web tab / mobile app). Multiple features share it via an internal pub/sub bus.

**Implemented today:** `ws/requests/`, `ws/system/`.

**Phase 6 future:** `order.created`, `order.fulfilled`, `payment.paid`, `payment.failed`, notification events via `notify.user.{user_id}`.

See [frontend-realtime-strategy.md](frontend-realtime-strategy.md).

---

## Cross-cutting principles

1. **Backend-controlled state** — Operational transitions and payment truth come from API and webhooks, not optimistic UI-only state machines.
2. **Typed contracts** — TypeScript `strict`; types align with backend docs and OpenAPI when enabled.
3. **Single WebSocket client** — One abstraction per platform parsing the same event envelope.
4. **Fail closed on auth** — 401 → refresh; refresh failure → logout and redirect to public login.
5. **No redesign** — All UI extends `shared-packages/design-system` extracted from the company website.

---

## API availability (Phase 6)

| Domain | REST status | WebSocket status |
|--------|-------------|------------------|
| Auth | Active | N/A |
| Requests | Active | Active (`ws/requests/`) |
| Products / Categories | Active | N/A |
| Orders | Active | Events documented; WS delivery Phase 6 |
| Payments | Active | Events documented; WS delivery Phase 6 |
| Bookings | Implemented; **not mounted** in URL config | N/A |
| Notifications | **Not implemented** | Planned `notify.*` |

Frontend modules for bookings and notifications ship with feature flags or stub hooks until backend mounts routes.

---

## Directory conventions (web)

```
web/src/
├── app/                    # App shell, providers
├── routes/                 # Route definitions per portal
├── layouts/                # Portal layouts
├── pages/                  # Route entry components
├── features/
│   ├── requests/
│   │   ├── components/
│   │   ├── hooks/
│   │   └── api/            # Re-exports or thin wrappers over shared hooks
│   ├── bookings/
│   ├── products/
│   ├── orders/
│   ├── payments/
│   └── notifications/
├── services/
│   ├── auth/
│   └── websocket/
└── lib/
    └── queryClient.ts
```

## Directory conventions (mobile)

```
mobile/
├── app/                    # Expo Router file-based routes
├── src/
│   ├── screens/
│   ├── features/           # Same domain split as web
│   ├── components/
│   ├── services/
│   │   ├── auth/
│   │   ├── websocket/
│   │   └── push/
│   └── lib/
└── ...
```

---

## Completion criteria

- [ ] All shared-packages exist as documented boundaries (may start as stubs).
- [ ] Web and mobile import design-system tokens; no duplicate color/font definitions.
- [ ] API client is the only HTTP entry point.
- [ ] Auth and WebSocket each have a single owner per app.
- [ ] Bookings and notifications respect backend mount status.
