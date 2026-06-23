# Booking Model Design

## 1. Purpose
The purpose of this document is to translate the approved Booking domain architecture into concrete data model designs. It maps the conceptual entities (Booking, Working Hours, etc.) into physical data storage requirements, defining relationships, constraints, and aggregation boundaries without prescribing the exact ORM code implementation.

## 2. Scope
This document covers:
* The entity definitions and field requirements for Booking, Working Hours, Availability Records, Reschedule Records, and No-Show Records.
* Cardinality and foreign key relationships to the parent Request domain.
* Database-level constraint requirements (specifically concurrency and overlap prevention).
* Auditing and metadata requirements for the tables.

## 3. Out of Scope
* Django `models.py` code generation.
* Database migration definitions.
* ORM indexing optimizations specific to a single query.
* Definitions for Request domain models.

## 4. Definitions
* **Aggregate Root:** The primary entity in a cluster of associated objects. In this domain, `Request` is the supreme aggregate root, and `Booking` acts as a sub-aggregate root.
* **Overlap Prevention Constraint:** A database-level restriction ensuring no two time ranges for a single technician intersect.
* **The system MUST NOT persist one BookingDay record per reserved day.
Reserved days are derived from Booking temporal boundaries.

## 5. Detailed Sections

### 5.1 Model Inventory & Entity Definitions

#### 5.1.1 Booking
* **Role:** Sub-aggregate root representing the scheduled commitment.
* **Requirements:**
  * Primary Key: UUID.
  * Parent Link: Mandatory foreign key to `Request` (Unique/One-to-One). **A Request may have only one Booking; a Booking may belong to only one Request.**
  * Multi-Day Representation: A multi-day engagement is represented as **ONE booking record** covering **MULTIPLE reserved calendar days**. The system MUST NOT create one booking per day.
  * State Tracking: `status` field constrained to the 6 valid lifecycle states (`unscheduled`, `scheduled`, `in_progress`, `completed`, `cancelled`, `no_show`).
  * Temporal Boundaries: `start_time` and `end_time` (Stored in UTC).
  * Duration Tracking: Estimated duration, explicitly measured in integer DAYS.
  * Reschedule Tracking: Integer counter `reschedule_count` (Default 0).
  * Timestamps: `created_at`, `updated_at`.

#### 5.1.2 Working Hours
* **Role:** Configuration entity defining technician capacity bounds.
* **Requirements:**
  * Primary Key: UUID.
  * Parent Link: Mandatory foreign key to `User` (Technician role).
  * Schedule Data: Definitions for active days of the week and daily start/end times (Stored in UTC),Schedule_blob (JSONField).
  * Timestamps: `created_at`, `updated_at`.

#### 5.1.3 Blackout Date
* **Role:** Exception entity defining technician-specific unavailability.
* **Requirements:**
  * Primary Key: UUID.
  * Parent Link: Mandatory foreign key to `User` (Technician).
  * Temporal Data: `start_time`, `end_time` (Stored in UTC).
  * Timestamps: `created_at`.

#### 5.1.4 Availability Record (computes availability on demand not a model class anymore)
* **Role:** Materialized or cached representation of a technician's open capacity, derived from Working Hours minus active Bookings.
* **Requirements:**
  * Primary Key: UUID.
  * Reference Link: Foreign key to `User` (Technician).
  * Temporal Data: Specific calendar date and the contiguous available blocks within that day.
  * State Integrity: Must be immediately invalidated or updated upon any Booking creation, cancellation, or reschedule for that technician.

#### 5.1.5 Reschedule Record
* **Role:** Audit entity capturing the historical delta of a schedule change.
* **Requirements:**
  * Primary Key: UUID.
  * Parent Link: Mandatory foreign key to `Booking`.
  * Audit Data: `previous_start_time`, `previous_end_time`, `new_start_time`, `new_end_time` (Stored in UTC).
  * Actor Tracking: Foreign key to the `User` who initiated the reschedule.
  * Context: `reason_code` or notes.
  * Timestamps: `created_at` (immutable).

#### 5.1.6 No-Show Record
* **Role:** Audit entity capturing the terminal declaration of an absence.
* **Requirements:**
  * Primary Key: UUID.
  * Parent Link: Mandatory foreign key to `Booking`.
  * Actor Tracking: Foreign key to the `User` who reported the no-show.
  * Context: Identification of the absent party (Customer or Technician).
  * Validation Data: Timestamp of declaration to prove adherence to the 2-hour grace period.
  * Timestamps: `created_at` (immutable).

### 5.2 Cardinality Matrix

| Source Entity | Relationship Type | Target Entity | Mandatory | Notes |
| :--- | :--- | :--- | :--- | :--- |
| `Request` | One-to-One (MVP) | `Booking` | No | A Request may have 0 or 1 Bookings. |
| `Booking` | Many-to-One | `Request` | Yes | Booking is strictly subordinate. |
| `User` (Tech) | One-to-One | `Working Hours` | Yes | Prerequisite for dispatch. |
| `Booking` | One-to-Many | `Reschedule Record` | No | Max 3 records per booking. |
| `Booking` | One-to-One | `No-Show Record` | No | Created only on terminal state. |

### 5.3 Required Constraints
* **Double-Booking Overlap Prevention:** The database MUST enforce a constraint ensuring that no two `Booking` records for the same `assigned_technician` (derived via the parent Request) have overlapping `start_time` and `end_time` windows where the `status` is `scheduled` or `in_progress`.
* **Blackout Date Constraint:** The System must reject.
Enforced by AvailabilityService using:
- transaction.atomic()
- select_for_update()
before BlackoutDate creation. System must reject any `BlackoutDate` record that overlaps with an existing `scheduled` or `in_progress` Booking for the same technician.
* **Multi-Day Span Support:** The overlap constraint must safely evaluate multi-day bookings.
* **Reschedule Limit Constraint:** The database or ORM layer must enforce a `CHECK` constraint ensuring `reschedule_count <= 3`.
* **Subordination Constraint:** A Booking must be deleted or archived if its parent Request is permanently purged.

### 5.4 Validation Requirements
* Valid state transitions must be enforced prior to saving the Booking model.
* Duration in days must be a positive integer.
* `end_time` must strictly evaluate as greater than `start_time`.

### 5.5 Audit Requirements
* All models must utilize centralized audit triggers (e.g., `log_action`) upon save/delete operations to fulfill the Phase 4 Booking Auditing rules.
* Reschedule and No-Show records act as immutable historical ledgers and must reject `UPDATE` operations.

### 5.6 Ownership Mapping
* **Creator:** System (Booking, Availability Record), Staff (Booking Schedule), Technician (Working Hours, No-Show), Any Auth Actor (Reschedule Record).
* **Final Authority:** Manager holds override rights; System governs structural invariants.

## 6. Dependencies
* `docs/architecture/booking/booking-domain.md`
* `docs/architecture/booking/booking-data-ownership.md`

## 7. Open Questions
* None at this time.

## 8. Completion Criteria
* Model design unambiguously translates all Phase 4 business rules into data requirements.
* Strict constraint definitions exist to prevent concurrency issues and double-booking at the database level.

