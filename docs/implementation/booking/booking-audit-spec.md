# Booking Audit Specification

## 1. Purpose
The purpose of this document is to define the implementation requirements for the Booking domain audit trail. it translates the high-level auditing architecture into a specific technical specification, ensuring that all mutations—whether human-initiated or system-generated—are forensically recorded and linked to the canonical Request lifecycle.

## 2. Scope
This document covers:
* Inventory of auditable actions within the Booking lifecycle.
* Standardized naming conventions for audit actions.
* Metadata and correlation requirements for each record.
* Risk-level classification for operations (e.g., Working Hour modifications).

## 3. Out of Scope
* Implementation code for audit middleware or decorators.
* Database schema for the audit log table.
* SIEM or centralized logging infrastructure design.
* Request domain audit definitions (Phase 3).

## 4. Definitions
* **Immutable Record:** An audit entry that cannot be edited or deleted once written, even by a Superadmin.
* **Audit Action:** The dot-notation label (e.g., `booking.scheduled`) identifying the specific mutation.
* **High-Risk Operation:** Actions that significantly impact platform capacity or financial integrity (e.g., Manager scheduling overrides).

## 5. Detailed Sections

### 5.1 Audit Naming Convention
All Booking audit records must follow the dot-notation standard: `{entity}.{action}`.
* Entity examples: `booking`, `working_hours`, `availability`.
* Action examples: `created`, `scheduled`, `rescheduled`, `updated`, `no_show`.

### 5.2 Audit Action Inventory

#### 5.2.1 Core Booking Actions

| Action Name | Actor | Resource | Required Metadata |
| :--- | :--- | :--- | :--- |
| `booking.created` | System | Booking | `request_id`, `correlation_id`, `trigger_event: "assignment.accepted"` |
| `booking.scheduled` | Staff / Manager | Booking | `start_time`, `end_time`, `duration_days`, `technician_id`, `is_displacement: bool`, `displaced_booking_id: uuid` |
| `booking.rescheduled` | Any Auth | Booking | `previous_window`, `new_window`, `reschedule_count`, `reason_code` |
| `booking.no_show` | Tech / Staff | Booking | `absent_party`, `waiting_period_met: true`, `grace_period_mins` |
| `booking.duration_extended` | Technician | Booking | `previous_duration_days`, `new_duration_days` |
| `booking.in_progress` | Technician | Booking | `started_at`, `location_verified: bool` |
| `booking.cancelled` | System | Booking | `request_id`, `trigger_reason: "request_cancelled"`, `refund_verified: bool` |

#### 5.2.2 Availability & Working Hours Actions

| Action Name | Actor | Resource | Required Metadata |
| :--- | :--- | :--- | :--- |
| `working_hours.updated` | Technician | Working Hours | `previous_schedule`, `new_schedule`, `active_commitments_checked: true` |
| `working_hours.override`| Manager | Working Hours | `technician_id`, `justification`, `override_type` |
| `blackout.created` | Technician / Manager | BlackoutDate | `actor_id`, `technician_id`, `blackout_id`, `correlation_id`, `timestamp` |
| `blackout.deleted` | Technician / Manager | BlackoutDate | `actor_id`, `technician_id`, `blackout_id`, `correlation_id`, `timestamp` |

### 5.3 Technical Requirements & Linkage

* **Correlation ID usage:** Every audit entry MUST include the `correlation_id` passed from the service layer to trace the entire transactional lineage.
* **Request Linkage:** All Booking audit records must store the `request_id` to allow forensic aggregation at the Request level.
* **Immutable Logs:** Audit records are explicit ledgers that are append-only, immutable, never updated, never deleted, and never soft-deleted. The database or service layer must reject any `UPDATE` or `DELETE` commands targeting the audit log table.
* **Retention Expectations:** Booking audit logs must be retained for a minimum of 7 years to satisfy regulatory and fulfillment disputes.

### 5.5 SLA Protection
* **Booking auditing:**
  * may record SLA-related metadata
  * may NOT modify SLA state
  * may NOT trigger SLA recalculation
  * may NOT perform financial logic

### 5.4 High-Risk & Controlled Operations

* **Manager-Controlled Operations:** `working_hours.override` and any scheduling action that bypasses standard availability alerts must be flagged as `HIGH_RISK`.
* **System-Owned Operations:** `booking.created` and `booking.cancelled` are system-owned and must record the `actor_id` of the system process (e.g., `0` or `SYSTEM`).

### 5.5 Audit Ownership Matrix

| Operation Category | Primary Producer | Final Authority |
| :--- | :--- | :--- |
| **Lifecycle Mutations** | `BookingService` | Manager |
| **Calendar Mutations** | `SchedulingService` | Manager |
| **Absence Records** | `NoShowService` | Manager |
| **Capacity Mutations** | `AvailabilityService` | Manager |

## 6. Dependencies
* `docs/architecture/booking/booking-auditing.md`
* `docs/implementation/booking/booking-model-design.md`
* `docs/architecture/request/request-auditing.md`

## 7. Open Questions
* UNRESOLVED — BUSINESS DECISION REQUIRED: Do we require a periodic audit consistency check to ensure every `booking.*` event has a corresponding `AuditLogEntry` record?

## 8. Completion Criteria
* Audit inventory is exhaustive for the Phase 4 scope.
* Metadata requirements for rescheduling and no-shows are clearly defined.
* Linkage rules between Booking and Request domains are established.
 requirements for rescheduling and no-shows are clearly defined.
* Linkage rules between Booking and Request domains are established.
