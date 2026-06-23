# RBAC Hardening Specification

**Status:** Draft / Refinement  
**Scope:** Authorization hardening, hierarchy protection, and granular enforcement  
**Target:** Production-safe implementation of RBAC in the Entercom Modular Monolith

---

## 1. Role Hierarchy Protection

To prevent administrative abuse and privilege escalation, the following hierarchy rules are enforced at the Service Layer.

| Actor | Can Manage (Operational) | Role Provisioning Restrictions |
|-------|--------------------------|--------------------------------|
| **Super Admin** | All roles | Cannot deactivate the last remaining Super Admin. |
| **Manager** | Staff, Technician, Customer | **NO** modification of other Managers. **NO** assignment of Super Admin or Manager roles. Can initiate Staff role assignment (requires Super Admin approval). |
| **Staff** | Customer | **NO** modification of Staff, Technician, Manager, or Super Admin roles. |
| **Technician** | None | Read-only access to self-profile. |
| **Customer** | None | Read-only access to self-profile. |

### 1.1 Core Restrictions
- **Self-Role Escalation:** Users cannot modify their own roles or permissions.
- **Equal-Level Restriction:** A user cannot modify, deactivate, or delete another user with the same role (e.g., Manager A cannot deactivate Manager B).
- **Promotion Cap:** A user cannot assign a role higher than their own in the hierarchy.
- **Super Admin Guard:** Super Admin role can only be granted by an existing Super Admin.

---

## 2. Permission Granularity Refinement

Vague permissions are replaced with explicit, action-oriented codenames to ensure least-privilege access.

### 2.1 Service Request Permissions
- `request.create`: Create a new request.
- `request.view_all`: View all requests in the system.
- `request.view_assigned`: View requests assigned to the actor.
- `request.view_owned`: View requests created by the actor (Customer).
- `request.edit`: Update request notes, add evidence, or modify details (Customer/Technician scoped to owned/assigned).
- `request.cancel_own`: Cancel a request before it starts (Customer/Staff).
- `request.cancel_started`: Cancel a request already `in_progress` (Manager only).
- `request.cancel_any`: Administrative cancellation of any request.
- `request.reassign`: Change the assigned technician/team.
- `request.postpone`: Postpone an assigned request timeline.
- `request.verify_completion`: Perform standard verification check (Staff/Manager).
- `request.override_verification`: Bypass or force-verify a request (Manager/Super Admin).

### 2.2 Booking & Technician Permissions
- `booking.create`: Create a scheduled booking.
- `booking.view_all`: View system-wide bookings.
- `booking.reschedule`: Reschedule a booking timeline.
- `technician.accept`: Accept an assigned job.
- `technician.decline`: Decline an assigned job.

### 2.3 User & Role Permissions
- `users.view`: List and view user profiles (non-sensitive).
- `users.view_pii`: View full PII (SSN, full address, private notes).
- `users.create`: Create new staff/technician accounts.
- `users.update_basic`: Update basic profile info.
- `users.deactivate`: Disable an account (soft-delete).
- `users.assign_roles`: Assign/remove roles from users.
- `roles.view`: View role definitions and permission mappings.
- `roles.manage`: Create/edit Role and Permission definitions (Super Admin).

### 2.4 Financial & Operational Permissions
- `pricing.view`: View base pricing and quotes.
- `pricing.edit_base`: Modify system-wide pricing rules.
- `pricing.waive_fee`: Apply discounts or waive fees on specific requests.
- `analytics.view`: View platform-wide operational analytics.
- `audit.view`: Access security and operational audit logs.
- `system.override`: "God mode" permission for emergency break-glass recovery.
  - **Purpose**: Bypass standard validation or state constraints during an active outage.
  - **Holders**: Explicitly granted to specific Super Admins only.
  - **Audit**: Every use triggers high-priority immediate alerts (pager).
  - **Timeout**: Maximum 2-hour TTL for the assignment.
  - **Approval**: Dual-control Super Admin approval required to assign.
  - **Logging**: Full request payload and response logged immutably.

---

## 3. Approval Matrix

Operations involving high risk or financial impact require explicit approval cycles.

| Action | Required Permission | Fallback Approver | Timeout | Timeout Behavior | Audit |
|--------|---------------------|-------------------|---------|------------------|-------|
| **Postpone Job** | `request.postpone` | Manager | 4h | Auto-escalate to Super Admin, notify both, audit event. | YES |
| **Cancel Started** | `request.cancel_started` | Manager | 2h | Auto-escalate to Super Admin, notify both, audit event. | YES |
| **Fee Waiver** | `pricing.waive_fee` | Manager | 24h | Auto-reject, notify requester, audit event. | YES |
| **Verification Override**| `request.override_verification` | Super Admin | Immediate | N/A (synchronous check) | YES |
| **Emergency Override** | `system.override` | Super Admin | Immediate | N/A (synchronous check) | YES |
| **Role Change (Staff+)**| `users.assign_roles` | Super Admin | 48h | Auto-reject, notify initiator, audit event. | YES |

---

## 4. Ownership Rules & Visibility

Visibility is restricted based on ownership and active assignment.

### 4.1 Role-Based Visibility
- **Customer:** Can only see requests they created. Hidden: Internal staff notes, technician private profiles.
- **Technician:** Can only see requests currently assigned to them. Hidden: Customer's billing history, other technicians' assignments.
- **Staff:** Can see all requests but restricted from viewing sensitive PII of other staff members. Can view Technician PII necessary for assignment.
- **Manager:** Full operational visibility.
- **Super Admin:** Full system visibility.

### 4.2 PII Protection (Hidden Fields)
- **Technicians:** See Customer phone/address **ONLY** for active assignments. Address is masked (city/zip only) until 1 hour before scheduled start.
- **Staff:** Cannot see raw payment method details (tokenized only).
- **Public/AI:** AI Assistant has **ZERO** access to unmasked PII (emails, phones, full addresses). AI must never be granted `users.view_pii`.

---

## 5. Audit Requirements

All authorization-sensitive events must be logged in a tamper-evident audit trail.

### 5.1 Audit Metadata Schema
Every logged event MUST include the following metadata payload to support REST and WebSocket tracking:
- `request_id`: Tracing HTTP Request ID (REST) or Message ID (WS).
- `correlation_id`: Broader operational correlation ID.
- `ip`: Origin IP address.
- `user_agent`: Client device/browser identifier.
- `actor`: UUID of the user performing the action.
- `target`: UUID of the user/resource being acted upon.
- `resource`: The domain entity type (e.g., `request`, `user`).
- `reason`: Required text justification for overrides/cancellations.
- `timestamp`: UTC ISO-8601 strict timestamp.

### 5.2 Events to Log
- **Authentication**: Login success/failure, token refreshes, password resets.
- **Failed Checks:** Every `403 Forbidden` response and failed `has_permission` call.
- **Role Changes:** Actor, Target User, Old Role, New Role.
- **Permission Updates:** Changes to `RoleDefinition` or `PermissionDefinition`.
- **Approval Lifecycle:** Request, approval, rejection (including reason codes and timeout events).
- **Override Actions:** Any use of `override` permissions or "god mode" flags.

### 5.3 Retention & Policy
- **Retention:** 7 years for financial/audit logs; 1 year for general access logs.
- **Visibility:** Only `audit.view` holders (Manager/Super Admin).
- **Tamper Prevention:** Logs are append-only. Use database triggers or external immutable storage (e.g., S3 Object Lock) for high-stakes logs.

---

## 6. Deny-by-Default Policy

The platform operates on a strict **fail-closed** architecture.

- **Missing Permission:** If an action has no defined permission, it is **DENIED**.
- **Missing Role:** If a user has no roles assigned, they are treated as **ANONYMOUS** (limited to public routes).
- **Unknown Action:** Any service method call without an explicit authorization check must raise an `ImproperlyConfigured` or `SecurityException`.
- **API Boundary:** DRF `permission_classes` map explicitly to route permissions. Unmapped routes default to a custom `FailClosedPermission` that denies all access until explicitly mapped.
- **WebSocket Boundary:** Channels `connect()` and message handlers MUST evaluate the same permission codenames. Unauthenticated or permissionless WS connections are forcibly closed.

### 6.1 Centralized Permission Evaluator
All permission checks MUST route through a single module: `apps.roles.services.permission_evaluator.py`.
- `has_permission(user, permission_codename)`: Evaluates global/role permission.
- `has_object_permission(user, permission_codename, obj)`: Evaluates ownership predicates.
- `invalidate_cache(user_id)`: Flushes RBAC cache for a user.
- **Single Source of Truth**: DRF permission classes, Service layer guards, and WebSocket consumers must import and use this module.

---

## 7. Role Assignment Workflow

Role assignments (particularly Staff, Manager, and Super Admin) require strict dual-control.

### 7.1 Dual-Control Implementation Model
- **Model**: `RoleChangeRequest` (fields: `initiator`, `target_user`, `requested_role`, `approved_by`, `status`, `expires_at`, `reason`).
- **Initiation**: Any user with `users.assign_roles` can initiate.
- **Approval**: Must be approved by a Super Admin.
- **Same-User Restriction**: `initiator` CANNOT equal `approved_by`. A user cannot approve their own promotion.
- **Expiry Behavior**: If not approved within 48h, a Celery beat task transitions status to `REJECTED`, logs an audit event, and notifies the initiator.
- **Execution:** Upon approval, Service Layer updates `UserRole` and triggers `invalidate_cache()`.

---

## 8. Cache Invalidation Strategy

RBAC checks are cached to optimize performance but require strict invalidation guarantees.

- **Cache Strategy:** Primary storage in Redis (`rbac:perms:{user_id}`). Optional local LRU memory cache per API worker to reduce Redis roundtrips.
- **TTL:** 15 minutes.
- **Invalidation Triggers:** Role assignment change, permission definition change, account deactivation, password reset.
- **Propagation:** Redis Pub/Sub invalidates local LRU caches across all API worker instances.
- **Fallback / Graceful Degradation:**
  - If Redis is unavailable, bypass the cache and read directly from PostgreSQL (degraded performance, safe authorization).
  - Use a `role_version` integer on the `User` model. If the JWT `role_version` claim does not match the DB, force a DB read and invalidate the cache.

---

## 9. Security Constraints

### 9.1 Escalation Prevention
- **Horizontal:** Ensure object-level ownership checks prevent User A from modifying User B's resources even if they have the same role.
- **Vertical:** Enforce hierarchy checks (§1) and dual-control for high-tier roles.

### 9.2 Enumeration & Reuse
- **ID Enumeration:** Use UUIDs for all public-facing resources (Users, Requests, Bookings).
- **Token Reuse:** Blacklist all refresh tokens for a user immediately upon role change or account suspension.

---

## 10. Future Scalability

### 10.1 Permission Grouping
As the system grows, avoid "permission explosion" by using **Permission Sets** (collections of permissions) attached to roles.

### 10.2 Regional Scoping
Support for `OrganizationUnit` filters in the `PermissionEvaluator` to restrict a Manager's authority.

---

## 11. Testing Requirements

A comprehensive suite of security regression tests is MANDATORY. CI pipelines must fail if any test is missing or fails.

### 11.1 Required Test Cases & Assertions
1. **Hierarchy Escalation Tests:** Assert `403 Forbidden` when Manager attempts to assign or modify a Super Admin role.
2. **Manager → SuperAdmin Denial Tests:** Assert `403 Forbidden` when Manager attempts to invoke `system.override` or perform `roles.manage`.
3. **Ownership Bypass Tests:** Assert `404 Not Found` or `403 Forbidden` when Technician A attempts to view or edit Technician B's assigned request via direct ID access.
4. **Horizontal Access Tests:** Assert Customer A cannot view Customer B's profile or requests.
5. **Cache Invalidation Tests:** Assert that changing a user's role immediately takes effect on their next API call, proving cache flush.
6. **Dual-Control Approval Tests:** Assert that a `RoleChangeRequest` fails if `initiator_id == approver_id`.
7. **Approval Timeout Tests:** Assert that mocking time +48h on a pending `RoleChangeRequest` correctly triggers auto-rejection and logs the event.
8. **Permission Denial Tests:** Assert `403 Forbidden` for a Technician attempting `pricing.edit_base`.
9. **WebSocket Auth Tests:** Assert connection dropped/closed (code 4000+) if an unauthenticated client connects or subscribes to a privileged channel.
10. **PII Masking Tests:** Assert serialized responses to Technicians mask customer addresses (returning zip code only) unless the job start time is `< 1h`.
11. **Audit Log Tests:** Assert that invoking `request.cancel_started` creates exactly one `AuditLogEntry` matching the schema in §5.1.
12. **AI Bypass Tests:** Assert that the AI service account receives `403 Forbidden` if attempting to call mutative service layer methods.
13. **Performance/Load Tests:** Assert that 1,000 concurrent permission checks do not exhaust DB connections (verifying Redis/LRU cache effectiveness).

---
**End of RBAC Hardening Specification**