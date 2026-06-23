# Booking Auditing Architecture

## 1. Purpose
The purpose of this document is to establish the standards and requirements for tracking historical mutations within the Booking domain. It ensures comprehensive traceability for scheduling actions, conflict resolutions, and terminal state transitions.

## 2. Scope
This document covers:
* Actions within the Booking domain that mandate an audit log entry.
* The required contextual metadata to be stored alongside audit logs.
* The correlation of Booking audit logs to their parent Request.

## 3. Out of Scope
* Database schema for the audit log table.
* Log rotation and data retention policies.
* External SIEM (Security Information and Event Management) integration formats.

## 4. Definitions
* **Audit Trail:** An immutable, chronological ledger of state changes, data mutations, and access events.
* **Correlation ID:** A unique identifier binding the Booking's audit entry to the overarching Request lifecycle transaction.

## 5. Detailed Sections

### 5.1 Auditable Actions
The system is required to immutably record the following Booking operations:
* Automated Booking creation.
* Initial scheduling (capturing the allocated temporal window).
* Rescheduling actions.
* State transitions (`in_progress`, `completed`).
* No-Show declarations.
* Cancellations.

### 5.2 Contextual Metadata Requirements
For specific actions, the audit log must contain robust metadata to ensure forensic traceability:
* **Rescheduling:** Must log the `previous_window`, `new_window`, and the `new_reschedule_count`.
* **No-Show:** Must log the specific actor who declared the no-show, the timestamp of the declaration (proving adherence to the 2-hour grace period), and the absent party.
* **Cancellation (Refund Dependency):** Must log the timestamp of refund verification and the subsequent Manager approval.

### 5.3 Correlation to Canonical Request
* Because the Request remains the canonical business object, every Booking audit entry must include a direct reference to the parent `request_id`.
* Actions that affect both domains simultaneously (e.g., a Booking `no_show` triggering a Request `cancelled` state) must share a unified correlation ID to trace the automated cascade effect.

## 6. Dependencies
* `docs/architecture/booking/booking-domain.md`
* `docs/workflows/no-show-policy.md`
* `docs/workflows/rescheduling-flow.md`

## 7. Implementation References
* `docs/implementation/booking/booking-audit-spec.md`

## 8. Open Questions
* None at this time.

## 8. Completion Criteria
* Audit logging is implemented for all defined actions without fail.
* The 3-reschedule limit and 2-hour no-show grace period evaluations are forensically traceable via the captured metadata.
* All Booking audit logs are intrinsically linked to their parent Request.
