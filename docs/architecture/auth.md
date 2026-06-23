# Authentication and authorization (RBAC)

## User identity (foundation)

- **Custom user** (`apps.users.User`): UUID primary key, **email-only** authentication identifier (`USERNAME_FIELD = "email"`), no username field.
- **Coarse role** on the user row: `UserRole` (`SUPER_ADMIN`, `MANAGER`, `STAFF`, `TECHNICIAN`, `CUSTOMER`) in `apps.users.enums` — used for defaults, admin clarity, and simple filtering. It does **not** replace fine-grained permission checks.
- **Fine-grained RBAC** remains in `apps.roles` (`PermissionDefinition`, `RoleDefinition`, `UserRole` assignments).

## Roles (coarse)

| Role | Typical surfaces |
|------|------------------|
| `customer` | Customer web / mobile |
| `technician` | Technician mobile (limited web if needed) |
| `staff` | Internal operations |
| `manager` | Approvals, reporting, escalations |
| `superadmin` | Platform configuration (use sparingly) |

Roles are **coarse groupings**. **Permissions** are the source of truth for authorization.

## Permission model

- Permissions are **string codenames** (for example `requests.view_assigned`, `orders.refund`).
- `apps.roles` defines `PermissionDefinition` and `RoleDefinition` with many-to-many mapping (foundation schema).
- Users receive permissions via **role assignments** (optional direct grants later if required).

### Hierarchy and naming

Recommended convention: `{domain}.{action}` or `{domain}.{resource}.{action}`.

Illustrative examples (not all may be implemented in every phase):

- `chat.participate_support`
- `notifications.receive`
- `requests.view_own`
- `requests.assign`
- `orders.place`
- `payments.initiate` (still server-gated)

**Managers** inherit staff-appropriate permissions via **role configuration in data**, not hard-coded superuser checks in views.

## Enforcement strategy

1. **Authentication:** JWT access token on REST; WebSocket token in query or header per consumer handshake.
2. **DRF:** Custom permission classes per app (`permissions.py`), calling **shared helpers** (for example `user_has_perm(request.user, "requests.assign")`).
3. **Channels:** Same helpers in consumer `connect` and message handlers; **fail closed** (reject early).
4. **Services:** For high-risk operations, **duplicate critical checks** at the service entrypoint (defense in depth). Serializers must not be the only gate.

## Superadmin convention

`superadmin` maps to Django `is_superuser` **or** explicit `platform.superadmin` permission — **pick one convention** and document it in code and ADRs when finalized.

## JWT (access + refresh)

- **Access token:** Short-lived (**30 minutes**); used on REST.
- **Refresh token:** Long-lived (**7 days**), **rotated** on each refresh; prior token invalidated.
- **Login:** `/api/v1/auth/login/` returns user summary and tokens.
- **Logout:** `/api/v1/auth/logout/` blacklists the current refresh token; `/api/v1/auth/logout-all/` invalidates all user sessions.
- **Refresh:** `/api/v1/auth/refresh/` rotates tokens.
- **Account Protection:** Brute-force protection (5 failures = 24h lock via `locked_until`).
- **Session Audit:** `UserSession` tracks `jti`, device, browser, and IP for every issued refresh token.

## CORS

- Allow explicit web origins from environment (`CORS_ALLOWED_ORIGINS`); avoid `*` with credentials.

## CSRF

- **Session-based browser forms** (if any): CSRF middleware and token.
- **JWT JSON APIs** for SPA/mobile: typically **no CSRF** on token endpoints; reassess if cookie-based flows are introduced.
- **Payment Provider webhooks:** **Signature verification**, not CSRF cookies ([payments.md](payments.md)).

## WebSocket authentication

- Authenticate during connection; reject unauthenticated clients for private channels.
- Do not trust message-level “who sent this” without verifying the sender’s permission for that resource/channel.

## Rate limiting

- DRF **ScopedRateThrottle** / **AnonRateThrottle** for expensive endpoints.
- Prefer Redis-backed throttles in production for horizontal scale.

## Audit

Authorization failures and sensitive actions should be recorded via `audit_logs` (schema prepared) as workflows mature.

## Related documentation

- [backend.md](backend.md) — where permission checks fit in the service layer.
- [../decisions/adr-002-rest-api.md](../decisions/adr-002-rest-api.md) — API style and client auth assumptions.
