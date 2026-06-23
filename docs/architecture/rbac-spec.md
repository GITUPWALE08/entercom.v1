# Entercom — RBAC Foundation Specification

**Document type:** Architecture specification (non-code)  
**Status:** MVP Authority  
**Scope:** Role definitions, permission vocabulary, ownership rules, enforcement patterns  
**Alignment:** Phase 2 → Step 3

---

## 1. Role Hierarchy & Responsibilities

The Entercom platform operates with five distinct product roles. While roles are permission-based, they follow a logical hierarchy of authority for administration.

| Role | Responsibility | Data Scope |
|------|----------------|------------|
| **Super Admin** | Full platform configuration, security overrides, and system-level definitions. | Global |
| **Manager** | Operational oversight, staff management, and critical workflow approvals (postponements, pricing). | Platform-wide operational |
| **Staff** | Daily triage, customer support, and coordination of service requests. | Platform-wide operational |
| **Technician** | Field execution, evidence submission, and task progress. | Assigned work only |
| **Customer** | Self-service request creation, profile management, and payment. | Owned data only |

---

## 2. Permission Model

### 2.1 Naming Convention
Permissions follow a `<resource>.<action>` pattern (slugs) to ensure a stable, predictable vocabulary for both code and database.

- **Resource:** The domain noun (e.g., `request`, `user`, `role`, `audit`).
- **Action:** The operation verb (e.g., `view`, `create`, `edit`, `delete`, `assign`, `approve`).

### 2.2 Granular Vocabulary (MVP)
The following permissions form the core vocabulary for the monolith:

- `users.view`, `users.manage` (create/deactivate)
- `roles.manage` (definition and assignment)
- `request.view_all`, `request.view_assigned`, `request.view_owned`
- `request.create`, `request.edit`, `request.cancel`, `request.assign`, `request.reassign`
- `request.verify` (staff/manager review)
- `booking.create`, `booking.reschedule`, `booking.view_all`
- `pricing.view`, `pricing.edit`
- `analytics.view`
- `audit.view`
- `technician.view_all`, `technician.manage`

---

## 3. Role → Permission Matrix

| Permission | Customer | Technician | Staff | Manager | Super Admin |
|------------|----------|------------|-------|---------|-------------|
| `request.create` | YES | NO | YES | YES | YES |
| `request.view_all` | NO | NO | YES | YES | YES |
| `request.view_assigned`| NO | YES | YES | YES | YES |
| `request.view_owned` | YES | NO | YES | YES | YES |
| `request.edit` (owned) | YES | YES (notes) | YES | YES | YES |
| `request.cancel` | YES (rules) | NO | YES | YES (over) | YES |
| `request.assign` | NO | NO | YES | YES | YES |
| `request.verify` | NO | NO | YES | YES | YES |
| `pricing.edit` | NO | NO | NO | YES | YES |
| `users.manage` | NO | NO | NO | YES | YES |
| `roles.manage` | NO | NO | NO | NO | YES |
| `audit.view` | NO | NO | NO | YES | YES |

---

## 4. Object Ownership Rules

Permissions alone do not grant access to specific rows. The **Service Layer** must evaluate ownership predicates.

- **Customer:** Access to `Request` where `request.customer_id == current_user.id`.
- **Technician:** Access to `Request` where `request.assigned_technician_id == current_user.id`.
- **Staff/Manager:** Access to all `Request` rows, but destructive actions (cancel, delete) are gated by state-specific rules.

---

## 5. Approval Rules

Certain state transitions require explicit higher-tier approval.

| Operation | Trigger | Required Role |
|-----------|---------|---------------|
| **Postpone Job** | Technician requests delay | Manager |
| **Cancel (Post-Start)** | Job is in `in_progress` state | Manager |
| **Fee Waiver** | Modification of pricing on request | Manager |
| **Final Verification** | Job moves to `completed` | Staff or Manager |
| **Admin Login Override** | Accessing customer account (future) | Super Admin + Audit |

---

## 6. Enforcement Layers

To ensure security and maintainability, RBAC must be enforced at multiple layers with a **Single Source of Truth**.

1. **Service Layer (Primary):** The authoritative gate. All business logic methods (e.g., `RequestService.cancel_request`) must call the `PermissionEvaluator`.
2. **DRF Permission Classes (Secondary):** Coarse-grained gating at the API boundary (e.g., `HasPermission('request.view_all')`).
3. **Serializers (Tertiary):** Field-level visibility based on roles (e.g., hiding internal notes from customers).
4. **Middleware:** Global authentication and active-status checks (already implemented).

---

## 7. Django Implementation Approach

### 7.1 Custom Permission Tables (Hybrid)
Entercom will use custom models instead of native Django `Groups` to allow for dynamic role expansion without database migrations.

- **PermissionDefinition:** (id, codename, label, description)
- **RoleDefinition:** (id, name, permissions M2M)
- **UserRole:** (user, role_definition)

**Justification:** Django's native permissions are tied to models (`app.add_model`). Entercom requires **logical** permissions (e.g., `pricing.edit`) that may span multiple models or no models at all.

### 7.2 The Evaluator Utility
A centralized `apps.roles.evaluators.has_permission(user, permission_codename, obj=None)` utility must be the only way permissions are checked.

---

## 8. Audit Requirements

Every privileged action must record an `AuditLogEntry`.

- **Who:** `actor_id`
- **What:** `action` (e.g., `request.assigned`)
- **When:** `timestamp`
- **Before/After:** JSON snapshot of changed fields (e.g., `old_assignee_id`, `new_assignee_id`)
- **Metadata:** IP address, User-Agent, Request ID.

---

## 9. Emergency Access & Revocation

- **Super Admin Override:** A "god mode" flag or permission exists but triggers **high-priority audit alerts**.
- **Instant Revocation:** Changing a `UserRole` or deactivating a `PermissionDefinition` must invalidate cached permission checks immediately.

---

## 10. Security Boundaries

- **AI Boundary:** AI agents (Support/Technician assistants) act as **proxies**. They must call the Service Layer using the **actor's identity**. AI must **NEVER** have direct database access or permission-bypass capabilities.
- **JWT Boundary:** JWT claims must **NOT** contain permission lists. Permissions are too volatile for long-lived tokens. The JWT identifies the **User**; the server resolves **Permissions** per request (backed by Redis caching).

---

## 11. Testing Requirements

All RBAC logic must be covered by integration tests:

1. **Permission Denial:** Assert `403 Forbidden` for a Technician attempting `pricing.edit`.
2. **Escalation Attempt:** Assert failure when a Customer attempts to assign a job to themselves.
3. **Ownership Bypass:** Assert that Technician A cannot view Technician B's assigned work via ID manipulation.
4. **Approval Logic:** Assert that a request cannot transition to `completed` without `Staff` or `Manager` verification.
5. **Cache Invalidation:** Assert that removing a role from a user takes effect on their next API call.
