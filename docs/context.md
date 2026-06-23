IMPORTANT:
Before generating code or architecture decisions,
AI assistants must review:
1. docs/context.md
2. relevant workflow docs
3. relevant ADRs

Identity foundation:
- Custom user model: `apps.users.User` — UUID primary key, email-only login identifier, coarse `UserRole` on the row (`apps.users.enums.UserRole`). Fine-grained RBAC remains in `apps.roles`.

Authentication:
- JWT (SimpleJWT): Rotating refresh tokens, 30m access / 7d refresh.
- Canonical endpoints: `/api/v1/auth/login/`, `/api/v1/auth/logout/`, `/api/v1/auth/logout-all/`, `/api/v1/auth/refresh/`.
- Account Protection: 5 failed attempts = 24h lock.
- Session Tracking: `UserSession` model for device/IP/activity auditing.

RBAC Phase 3:
- Phase 3 Step 1 completed: Database foundation implemented safely.
- Implemented models: `PermissionDefinition`, `RoleDefinition`, `RolePermission`, `UserRole`, `ApprovalRequest`, `PermissionCacheVersion`.
- Pending work: Evaluators, decorators, DRF permissions, ownership logic, cache invalidation logic, and WebSocket auth.

Phase 2 Stage 4:
- Stage 4 completed: Audit logging hooks implemented.
- Hardened `AuditLogEntry` model with full metadata schema (request/correlation IDs, IP, UA).
- Centralized `AuditService` and context-aware middleware.
- Integrated hooks for Auth events and Role management.