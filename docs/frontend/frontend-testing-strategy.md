# Frontend Testing Strategy

## Purpose

Define the testing layers, ownership, tooling, and scope for web and mobile frontends. Documentation only — no test code in this phase.

## Related documentation

- [frontend-architecture.md](frontend-architecture.md) — package boundaries
- [frontend-api-integration.md](frontend-api-integration.md) — hooks and endpoints
- [frontend-authentication.md](frontend-authentication.md) — auth flows to test
- [frontend-realtime-strategy.md](frontend-realtime-strategy.md) — WS consumption tests
- Backend: `docs/implementation/*/test-strategy.md`

---

## Testing principles

1. **Test behavior, not implementation** — Assert what users and hooks observe, not internal state shape.
2. **Backend is integration truth** — Frontend tests mock HTTP/WS; E2E hits real API in staging.
3. **Shared packages tested once** — `api-client`, `validation`, `auth` helpers tested in shared-packages; apps import with confidence.
4. **Permission-aware** — Tests cover role and permission gates explicitly.
5. **No payment lies** — Tests never assert client-side paid state without mocked server response.

---

## Tooling

| Layer | Web | Mobile | Shared |
|-------|-----|--------|--------|
| Runner | Vitest | Jest (Expo) | Vitest |
| Component | React Testing Library | React Native Testing Library | — |
| Hooks | `@testing-library/react` renderHook | renderHook (RNTL) | Vitest |
| API mock | MSW (Mock Service Worker) | MSW or fetch mock | MSW |
| E2E web | Playwright | — | — |
| E2E mobile | — | Maestro or Detox | — |
| Coverage | Vitest coverage (v8) | Jest coverage | Vitest |

**CI:** Run shared-packages tests first; then web; then mobile. Fail fast on contract breaks.

---

## Test pyramid

```text
        E2E (few)
       /          \
  Integration (some)
 /                    \
Component + Hook (many)
```

| Layer | % of tests (target) | Speed |
|-------|---------------------|-------|
| Component | 50% | Fast |
| Hook | 25% | Fast |
| Page | 10% | Medium |
| Integration | 10% | Medium |
| API (shared) | 5% | Fast |
| E2E | 5% | Slow |

---

## Component tests

**Scope:** Presentational and container components in design-system and features.

**Location:**

- `shared-packages/design-system/**/*.test.tsx`
- `web/src/features/{domain}/components/*.test.tsx`
- `mobile/src/components/*.test.tsx`

**What to test:**

| Component type | Assertions |
|----------------|------------|
| Button | Renders label; disabled state; focus outline class |
| Card | Children render; border/token classes applied |
| Form field | Label association; error message display |
| PermissionGate | Renders children when permitted; hides when not |
| Toast | Appears and dismisses |
| Table | Headers; empty state; row count from props |

**What not to test:**

- Snapshot-only tests with no behavioral assertion
- CSS pixel-perfect matching
- Third-party library internals

**Design-system:** Verify token class names or CSS variables are applied — not redesign compliance.

---

## Hook tests

**Scope:** React Query hooks and custom hooks wrapping API or WS.

**Location:**

- `web/src/features/{domain}/hooks/*.test.ts`
- `mobile/src/features/{domain}/hooks/*.test.ts`

**Setup:**

- Wrap in `QueryClientProvider` with `retry: false`
- MSW handlers for endpoints
- Mock `AuthProvider` with role fixtures

**What to test:**

| Hook | Assertions |
|------|------------|
| `useRequests` | Returns list on success; loading/error states |
| `useCreateRequest` | Calls POST; invalidates `['requests']` on success |
| `useLogin` | Sets auth context; stores tokens |
| `useInitializePayment` | Returns payment session; does not set paid |
| `useRequest` (with WS) | Invalidates on mocked WS message |

**Fixtures:** `shared-packages/test-fixtures/` — sample request, order, payment JSON from API docs.

---

## Page tests

**Scope:** Route entry components with router and providers.

**Location:**

- `web/src/pages/**/*.test.tsx`
- `mobile/src/screens/**/*.test.tsx`

**Setup:**

- Memory router with route params
- MSW for page-level data requirements
- Auth wrapper with role per test case

**What to test:**

| Page | Assertions |
|------|------------|
| Customer request list | Renders rows from API; empty state |
| Request detail | Loads by id; 404 on missing |
| Staff assign | Assign button visible for staff only |
| Checkout | Creates order; redirects to payment |
| Login | Redirects to portal on success |

**Avoid:** Full portal layout pixel tests; test data rendering and guards.

---

## Integration tests

**Scope:** Multi-module flows within one app — providers, router, hooks, and components together.

**Location:**

- `web/src/__tests__/integration/`
- `mobile/src/__tests__/integration/`

**Examples:**

| Flow | Modules involved |
|------|------------------|
| Login → dashboard | AuthProvider, router, MSW auth |
| Create request → submit | Form, validation, mutation, list refresh |
| Add to cart → checkout → initialize payment | Cart store, order mutation, payment mutation |
| WS request assigned → list updates | WS mock, query invalidation, list component |

**Not integration:** Cross-app (web + mobile) — that's E2E or contract tests.

---

## API tests (shared-packages)

**Scope:** `shared-packages/api-client` and `validation` without React.

**Location:**

- `shared-packages/api-client/src/**/*.test.ts`
- `shared-packages/validation/src/**/*.test.ts`
- `shared-packages/auth/src/**/*.test.ts`

**What to test:**

| Area | Assertions |
|------|------------|
| Auth client | Login request shape; refresh on 401 |
| Request list | Parses wrapped `{ success, data }` envelope |
| Order client | Parses raw DRF response |
| Error normalizer | Maps 400 field errors consistently |
| Zod schemas | Reject invalid create-request payload |
| Role normalize | `CUSTOMER` → `customer` |

**MSW:** Define handlers matching real backend paths under `/api/v1/`.

---

## E2E tests

**Scope:** Critical user journeys against staging or docker-compose stack (real backend).

**Web — Playwright:**

- `e2e/web/customer-request-flow.spec.ts`
- `e2e/web/customer-checkout-flow.spec.ts`
- `e2e/web/staff-fulfill-order.spec.ts`
- `e2e/web/auth-session.spec.ts`

**Mobile — Maestro/Detox:**

- `e2e/mobile/customer-login.yaml`
- `e2e/mobile/technician-accept-job.yaml`

### Priority E2E flows

| Flow | Roles |
|------|-------|
| Login → logout | All |
| Customer: create request → submit | Customer |
| Technician: accept assignment | Technician |
| Customer: browse → cart → order → payment init | Customer |
| Staff: fulfill order | Staff |
| Manager: view audit logs | Manager |

**E2E rules:**

- Use test accounts per role (seeded in backend)
- Do not hit production Paystack — use test keys or mock redirect
- Clean up created resources or use isolated test tenant
- Bookings E2E gated until API mounted

---

## Domain-specific test requirements

### Requests

- List scoped by role (customer sees own only — mock 403/empty for others' ids)
- Timeline loads on detail
- Quote approve/reject mutations invalidate quotes query
- WS `request.assigned` triggers list refetch

### Bookings

- Feature-flag off → routes hidden
- When enabled: schedule mutation invalidates booking detail
- No test for `POST /bookings/` (does not exist)

### Products

- Catalog loads for customer
- Staff create product invalidates list
- Inventory adjust updates product detail

### Orders

- Customer `order.view_own` — list does not include other customers' orders
- Staff fulfill mutation
- WS `order.fulfilled` invalidates order (when WS testable)

### Payments

- Initialize returns redirect URL / reference
- Never assert paid without mock webhook or WS `payment.paid`
- Cancel payment mutation

### Notifications

- Stub until API ships
- WS notify increments unread count
- Dedup duplicate events

### Authentication

- Full login/logout/refresh cycle
- 401 → refresh → retry
- Refresh fail → logout
- Role guard redirect matrix
- WS 4004 → logout

---

## Mocking strategy

| Dependency | Mock approach |
|------------|---------------|
| HTTP | MSW handlers per test file |
| WebSocket | `WebSocketService` mock at module boundary |
| Auth storage | In-memory adapter in tests |
| Expo SecureStore | Jest mock |
| React Router | MemoryRouter |
| Paystack redirect | Mock window.location / Linking |

**Do not mock:** React Query internals, tested components' direct children props.

---

## Coverage targets (Phase 6)

| Package / app | Line coverage target |
|---------------|---------------------|
| `shared-packages/api-client` | 85% |
| `shared-packages/validation` | 90% |
| `shared-packages/auth` | 90% |
| `web/src/features` | 75% |
| `mobile/src/features` | 70% |
| Design-system primitives | 80% |

Exclude: generated types, `main.tsx`, Expo boilerplate.

---

## Test data and fixtures

**Owner:** `shared-packages/test-fixtures/`

| Fixture | Contents |
|---------|----------|
| `users.ts` | Per-role user objects |
| `requests.ts` | Draft, submitted, assigned request |
| `orders.ts` | Pending, fulfilled order |
| `payments.ts` | Initialized, paid, failed payment |
| `products.ts` | Product with inventory |

Align with backend serializer shapes from implementation docs.

---

## CI pipeline order

```text
1. shared-packages: lint + unit + API tests
2. web: lint + unit + integration
3. mobile: lint + unit
4. E2E (nightly or pre-release on staging)
```

PR gate: steps 1–3. E2E optional on PR if staging unavailable.

---

## Out of scope (Phase 6)

- Visual regression testing (unless company site baseline captured later)
- Load/performance testing frontend
- Backend API tests (see backend test inventory)
- Paystack live webhook E2E

---

## Completion criteria

- [ ] Vitest/Jest configured in web, mobile, shared-packages
- [ ] MSW handlers cover all mounted API endpoints
- [ ] Auth and permission matrix have dedicated tests
- [ ] Critical E2E flows documented and scripted
- [ ] Coverage thresholds enforced in CI
