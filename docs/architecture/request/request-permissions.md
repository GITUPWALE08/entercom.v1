# Request Permissions & RBAC Mapping

## 1. Purpose
This document maps RBAC (Role-Based Access Control) permissions to specific operations within the Request Lifecycle System. It establishes the security boundaries for different user roles, ensuring that only authorized actors can trigger state transitions or modify domain data.

## 2. Scope
- Definition of permission codenames for request operations.
- Mapping of permissions to core system roles (Customer, Technician, Staff, Manager, Superadmin).
- Detailed scope and restrictions for every defined permission.
- Transition ownership matrix.

## 3. Out of Scope
- Detailed implementation of the `has_permission` helper (see Phase 2).
- Permissions for unrelated domains (e.g., User management).
- Token-level authorization details (see `docs/architecture/auth.md`).

## 4. Definitions
- **Permission Scope**: The extent of the permission, often limited to "Owned" resources or "Global" access.
- **Guard**: An additional check performed at runtime (e.g., checking if a technician is actually assigned to the request they are trying to update).

## 5. Escalation Permission Clarification
*   `request.escalate` is the canonical RBAC permission.
*   `escalation.triggered` is an event name.
*   Event names and permissions intentionally use different namespaces.

## 6. Payment Authorization Model
*   Payment confirmation is system-driven.
*   Payment gateways notify the platform through webhooks.
*   No human actor performs payment processing.
*   Therefore no RBAC permission named `payment.process` exists.
*   Request state transitions after payment are performed by trusted backend services.

## 7. Detailed Permission Sections

### 7.1 Customer Permissions
| Permission | Purpose | Scope | Restrictions |
| :--- | :--- | :--- | :--- |
| `request.create` | Start new service need | Owned | Limited to `draft` status |
| `request.submit` | Finalize draft | Owned | Cannot modify after submission |
| `request.cancel` | Abort own request | Owned | Blocked once `assigned` or `in_progress` |
| `quote.approve` | Accept financial terms | Owned | Blocked if quote is `expired` |
| `quote.reject` | Decline terms | Owned | Requires a reason code |
| `quote.revise` | Request alternative terms | Owned | Maximum 3 revisions |
| `quote.revise` | Allows customer to request modifications to a quote | Maximum 3 revisions, Revision count tracked on Quote, Exceeding limit causes quote expiry. |


### 5.2 Technician Permissions
| Permission | Purpose | Scope | Restrictions |
| :--- | :--- | :--- | :--- |
| `assignment.accept` | Commit to assignment | Assigned | Within 48h timeout window |
| `assignment.decline` | Refuse assignment | Assigned | Requires mandatory reason code |
| `request.update` | Perform fulfillment | Assigned | Only in `in_progress` state |
| `quote.create` | Generate onsite estimate| Assigned | Subject to staff review policy |
| `verification.submit`| Finish work | Assigned | Requires all mandatory evidence |

### 5.3 Staff Permissions
| Permission | Purpose | Scope | Restrictions |
| :--- | :--- | :--- | :--- |
| `request.triage` | Categorize & Priority | Global | Only for `submitted` requests |
| `request.assign` | Match tech to request | Global | Only for requests clearing all gates |
| `request.cancel` | Internal cancellation | Global | Before `assigned` (freely) |
| `quote.create` | Remote estimation | Global | Standard revision limits apply |
| `verification.verify`| Review tech work | Global | Cannot verify own work (if tech) |

### 5.4 Manager Permissions
| Permission | Purpose | Scope | Restrictions |
| :--- | :--- | :--- | :--- |
| `request.escalate` | Manual tier jump | Global | Must provide justification |
| `escalation.resolve`| Administrative closure | Global | High-risk audit trail enforced |
| `verification.override`| Bypass QA failures | Global | Mandatory justification & audit |
| `request.cancel_active`| Force cancellation | Global | Required for `in_progress` items |

### 5.5 Superadmin Permissions
| Permission | Purpose | Scope | Restrictions |
| :--- | :--- | :--- | :--- |
| `system.override` | Global break-glass | Universal | **Critical Audit** trigger; restricted use |

## 6. Transition Ownership Matrix

| From State | To State | Primary Actor | Permission Required |
| :--- | :--- | :--- | :--- |
| `draft` | `submitted` | Customer | `request.submit` |
| `submitted` | `staff_review` | Staff | `request.triage` |
| `staff_review` | `awaiting_quote` | Staff | `request.triage` |
| `awaiting_quote` | `awaiting_customer_approval`| Staff / Tech | `quote.create` |
| `awaiting_customer_approval`| `awaiting_payment` | Customer | `quote.approve` |
| `awaiting_assignment`| `assigned` | Staff | `request.assign` |
| `assigned` | `in_progress` | Technician | `assignment.accept` |
| `in_progress` | `pending_verification`| Technician | `verification.submit` |
| `pending_verification`| `completed` | Staff | `verification.verify` |
| Any | `escalated` | Manager / System| `request.escalate` |
| Any | `cancelled` | Actor | `request.cancel` / `request.cancel_active` |



## 7. Dependencies
- **Phase 2 RBAC Spec**: Foundational permission architecture.
- **docs/workflows/request-lifecycle.md**: Defines the transitions being authorized.

## 8. Open Questions
- **Staff-Tech Overlap**: RESOLVED — BUSINESS DECISION (A user cannot hold both Staff and Technician roles, one role per user)

## 9. Completion Criteria
- Permissions cover every transition in the Canonical State Machine.
- Ownership of each lifecycle stage is explicitly mapped to RBAC permissions.
- Security restrictions (Guard conditions) are documented for high-risk actions.
