# Frontend Authentication

## Purpose

Define client-side authentication flows, session handling, role-based routing, and permission-based rendering for web and mobile.

**Server enforces all authorization.** Client checks are for navigation and UX only.

## Related documentation

- [../architecture/auth.md](../architecture/auth.md) — backend RBAC and JWT
- [frontend-routing.md](frontend-routing.md) — route guards
- [frontend-architecture.md](frontend-architecture.md) — ownership boundaries
- [frontend-api-integration.md](frontend-api-integration.md) — auth endpoints

---

## Auth stack

| Layer | Owner |
|-------|-------|
| Auth API | `shared-packages/api-client/src/auth/` |
| Types, role helpers | `shared-packages/auth/` |
| Token storage interface | `shared-packages/auth/storage.ts` |
| Web storage impl | `web/src/services/auth/storage.ts` |
| Mobile storage impl | `mobile/src/services/auth/storage.ts` (Expo SecureStore) |
| Auth provider | `web/src/providers/AuthProvider.tsx`, `mobile/src/providers/AuthProvider.tsx` |
| HTTP interceptor | `shared-packages/api-client` — attach token, refresh on 401 |
| Route guards | Per app |

---

## Token model

| Token | Lifetime | Storage | Usage |
|-------|----------|---------|-------|
| Access | 30 minutes | Memory (web); SecureStore (mobile) | `Authorization: Bearer` on REST and WS |
| Refresh | 7 days | Secure storage | `POST /auth/refresh/` only |

**Rotation:** Each refresh returns new access + refresh; prior refresh token is blacklisted.

**Role version:** Embedded in token. If user's `role_version` changes server-side, refresh fails and WebSocket closes with code `4004` → force re-login.

---

## Login flow

### Web and mobile (identical logic)

```text
1. User submits email + password on /login
2. POST /api/v1/auth/login/
   Body: { "email": "...", "password": "..." }
3. On success:
   a. Store refresh token (secure storage)
   b. Hold access token in memory
   c. Set user in AuthProvider: { id, email, role, first_name, last_name }
   d. Clear any stale query cache
   e. Connect WebSocket (if permission allows)
   f. Redirect to role default route (see below)
4. On failure:
   a. 401 → invalid credentials message
   b. Locked account (locked_until) → show lockout message
   c. 429 → rate limit message (30/minute on auth endpoints)
```

### Default post-login redirect

| Role | Web | Mobile |
|------|-----|--------|
| `CUSTOMER` | `/portal/customer` | `/(customer)/(tabs)` |
| `TECHNICIAN` | — (optional) | `/(technician)/(tabs)/jobs` |
| `STAFF` | `/portal/staff` | N/A (web only) |
| `MANAGER` | `/portal/manager` | N/A |
| `SUPER_ADMIN` | `/portal/admin` | N/A |

**Deep link preservation:** If user was redirected to login from a protected URL, return there after successful login when role permits.

---

## Refresh flow

### Proactive refresh

- Schedule refresh at **80% of access token lifetime** (~24 min)
- On app foreground (mobile): check expiry and refresh if needed

### Reactive refresh (401 interceptor)

```text
1. API call returns 401
2. If not already refreshing:
   a. POST /api/v1/auth/refresh/ { "refresh": "<token>" }
   b. On success: update tokens, retry original request once
   c. On failure: logout, redirect to login
3. If refresh in progress: queue concurrent requests, retry after refresh
```

### Refresh response

```json
{
  "access": "...",
  "refresh": "..."
}
```

### Refresh failure conditions

- Refresh token expired or blacklisted
- `role_version` mismatch
- Account disabled or locked

→ Full logout, clear storage, disconnect WS, redirect to login.

---

## Logout flow

### Single session

```text
POST /api/v1/auth/logout/
Body: { "refresh_token": "..." }
→ 204 No Content
→ Clear tokens, AuthProvider, query cache, WebSocket
→ Redirect /login
```

### All sessions

```text
POST /api/v1/auth/logout-all/
→ 204 No Content
→ Same client cleanup as single logout
```

---

## Role-based routing

### Normalization

API returns uppercase roles (`CUSTOMER`, `STAFF`, etc.). Client normalizes to lowercase for comparisons:

```text
CUSTOMER      → customer
TECHNICIAN    → technician
STAFF         → staff
MANAGER       → manager
SUPER_ADMIN   → superadmin
```

`shared-packages/auth/normalizeRole()` is the single function.

### Route guard hierarchy

```text
Authenticated?
  └─ No → /login
  └─ Yes → Role allowed for route prefix?
       └─ No → redirect to role home or /403
       └─ Yes → Permission required for route?
            └─ No → /403 or hide route
            └─ Yes → render
```

### Portal access matrix

| Route prefix | customer | technician | staff | manager | superadmin |
|--------------|----------|------------|-------|---------|------------|
| `/portal/customer` | yes | no | no | no | no |
| `/portal/staff` | no | no | yes | yes | yes |
| `/portal/manager` | no | no | no | yes | yes |
| `/portal/admin` | no | no | no | no | yes |
| Mobile customer | yes | no | no | no | no |
| Mobile technician | no | yes | no | no | no |

Managers and superadmins access staff routes; implement via shared guard: `isStaffPlus(role)`.

---

## Permission-based rendering

Permissions are string codenames (e.g. `request.assign`, `order.fulfill`). Source:

1. **Phase 6:** Static matrix per role in `shared-packages/auth/permissions.ts` (mirrors backend matrices)
2. **Future:** Permissions endpoint or JWT claims expansion

### API

```text
hasPermission(user, 'request.assign'): boolean
hasAnyPermission(user, ['order.view', 'order.view_own']): boolean
hasRole(user, 'staff'): boolean
isStaffPlus(user): boolean
```

### UI patterns

**Hide action (preferred for buttons):**

```text
<PermissionGate permission="request.assign">
  <AssignButton />
</PermissionGate>
```

**Route-level:** `permissions.ts` map route → required permission codename.

**Never rely on UI-only hiding for security** — backend returns 403/404 on unauthorized API calls.

### Domain permission quick reference

| Action | Permission |
|--------|------------|
| Create request | `request.create` |
| Assign request | `request.assign` |
| Accept assignment | `assignment.accept` |
| Create quote | `quote.create` |
| Approve quote | `quote.approve` |
| Fulfill order | `order.fulfill` |
| Initialize payment | `payment.initialize` |
| Adjust inventory | `inventory.adjust` |
| View audit logs | `audit.view` |
| Connect WebSocket | `websocket.connect` |

Full matrices: `apps/requests/permissions/matrix.py`, `docs/implementation/*/permission-mapping.md`.

---

## Session handling

### Web

| Concern | Approach |
|---------|----------|
| Access token | In-memory variable (not localStorage) |
| Refresh token | httpOnly secure cookie (preferred) or encrypted localStorage fallback |
| Tab sync | Optional `BroadcastChannel` to logout all tabs on logout-all |
| Session expiry | Redirect to login with `?reason=session_expired` |
| CSRF | Not required for JWT JSON API |

### Mobile

| Concern | Approach |
|---------|----------|
| Access + refresh | Expo SecureStore |
| Biometrics | Future enhancement; not Phase 6 |
| Background | Refresh on foreground; WS reconnect |
| Push token | Registered post-login; cleared on logout |

### User session audit

Backend tracks `UserSession` (JTI, IP, user agent). Client may display active sessions when users API ships; `logout-all` invalidates all.

---

## WebSocket authentication

Connect with access token:

- Query: `ws/requests/?token=<access>`
- Or header: `Authorization: Bearer <access>`

On token expiry:

1. WS may close with `4002`
2. Client refreshes token
3. Reconnects with new access token
4. Re-subscribes to active request channels

Close codes:

| Code | Action |
|------|--------|
| 4001 | Auth failed → logout |
| 4002 | Token expired → refresh + reconnect |
| 4003 | Permission denied → disconnect WS, show notice |
| 4004 | Role version changed → logout |

---

## Account lockout

After 5 failed login attempts, account locked for 24 hours (`locked_until`).

Client displays server message; do not implement client-side lockout counters.

---

## Error states

| Scenario | UX |
|----------|-----|
| Invalid credentials | Inline form error |
| Account locked | Banner with unlock time if provided |
| Session expired | Toast + redirect login |
| 403 on API | Toast "You don't have permission" |
| Network error | Retry button; offline banner on mobile |

---

## Testing requirements

- Login success/failure mocks
- Refresh interceptor: 401 → refresh → retry
- Refresh failure → logout
- Role guard redirects per matrix
- PermissionGate hides/shows correctly
- WS reconnect after 4002

See [frontend-testing-strategy.md](frontend-testing-strategy.md).

---

## Forbidden client behaviors

1. Storing access tokens in localStorage (web)
2. Skipping refresh and prompting re-login on every 401 without retry
3. Client-side role elevation
4. Trusting URL parameters for user identity
5. Sending refresh token on non-refresh API calls
