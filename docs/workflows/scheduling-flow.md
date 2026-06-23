# Scheduling Workflow

## 1. Purpose
The purpose of this document is to define the precise orchestration flow for placing a Booking onto a Technician's calendar. It establishes strict bounds around who can schedule, when scheduling occurs, and how conflicts are prevented.

## 2. Scope
This document covers:
* Booking creation triggers and prerequisites.
* Scheduling authority and role restrictions.
* Double-booking prevention and validation.
* Duration estimation processes.
* The rescheduling flow and limits.

## 3. Out of Scope
* Calendar UI/UX design.
* Timezone conversion technical implementations.
* Request assignment logic (handled in Phase 3).

## 4. Definitions
* **Scheduling Flow:** The process of moving an `unscheduled` booking to a `scheduled` status by assigning a specific temporal window.

## 5. Rules

### 5.1 Booking Creation Trigger
* A Booking is automatically created when:
  1. A Request has been assigned.
  2. The Technician explicitly accepts the assignment.
* The system instantiates the Booking with a status of `unscheduled`.

### 5.2 Scheduling Authority
* **Staff performs scheduling.**
* Customers cannot schedule Bookings.
* Technicians cannot schedule Bookings.

### 5.3 Duration Estimation & Extension
* The required temporal duration for the Booking is initially estimated by the assigned technician.
* **Extension Ownership:** The assigned Technician may extend the duration later.
* **Conflict Rule:** Extensions that conflict with existing bookings are **Hard Rejected**. No automatic displacement or manager override occurs.

### 5.4 Scheduling Confirmation & Validation
* To transition the Booking to `scheduled`, the Staff actor must propose a booking window.
* **Locking Strategy:** Scheduling operations MUST execute within a database transaction. Technician availability MUST be revalidated inside the transaction before booking confirmation.
* **Overlap Prevention:** The system MUST reject overlapping bookings even if the conflict was not visible during initial availability lookup. Database constraints and transactional locking are authoritative. The first successful committed transaction wins.

### 5.5 Emergency Scheduling
* **No Displacement:** Emergency requests do not automatically displace existing bookings.
* **Unscheduled State:** If no available technician exists, the Booking remains `unscheduled`.
* **Lifecycle Continuation:** The Request continues through its normal lifecycle and may expire or cancel based on Request rules if not scheduled.

### 5.6 Reassignment Handling
* **Technician Unavailability:** If a technician becomes unavailable after assignment, manager intervention for reassignment is mandatory. The Request remains active and the Booking remains `unscheduled`.
* **Decline Handling:** If a technician declines an assignment after a Booking exists, the record is preserved but reset to `unscheduled`. Staff reassignment is required.

### 5.5 Rescheduling Process
* Once scheduled, the booking window can be altered via a Reschedule action.
* **Allowed Actors:** Customer, Technician, Staff, Manager.
* **Maximum Reschedules:** 3 reschedules.
* Any reschedule attempt triggers the same strict Availability Validation and Double-Booking Prevention checks.

### 5.6 Timezone Policy
* **UTC Standards:** All booking datetimes are stored in UTC.
* **Local Display:** datetimes are displayed in the user's configured timezone.
* **Normalization:** Technician availability is maintained in local time and normalized to UTC for scheduling calculations.

### 5.7 Blackout Date Policy
* **Exclusion:** Bookings cannot be scheduled during technician blackout dates.
* **Precedence:** Existing bookings take precedence. Blackout dates cannot be created if they conflict with scheduled bookings.

### 5.8 Emergency Booking Policy
* **Assignment Required:** Emergency requests still require technician assignment.
* **Working Hour Bounds:** Cannot be scheduled outside technician working hours.
* **Manual Displacement:** Emergency requests do not automatically displace existing bookings. Manager intervention is mandatory for displacement.

### 5.9 Capacity Reservation Policy
* **Reservation:** A booking reserves technician capacity across every scheduled day.
* **Exclusivity:** No overlapping bookings may exist during any reserved period.

## 6. Required Matrices/Tables

### Scheduling Authority Matrix

| Action | Customer | Technician | Staff | Manager | System |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Create Booking** | Denied | Denied | Denied | Denied | **Allowed** |
| **Schedule Booking** | Denied | Denied | **Allowed** | **Allowed** | Denied |
| **Reschedule Booking** | **Allowed** | **Allowed** | **Allowed** | **Allowed** | Denied |

## 7. Edge Cases
* **Cross-Day Scheduling:** Handling scheduling requests where the estimated duration spans past the technician's end-of-day working hours.
* **Concurrent Scheduling:** Two Staff members attempting to schedule different bookings for the same technician in the exact same timeslot simultaneously (handled via strict DB-level concurrency control).

## 8. Audit Expectations
* Every scheduling and rescheduling action must be logged, including the previous booking window (if applicable), the new booking window, and the actor performing the schedule. The reschedule counter must be auditable.

## 9. Dependencies
* Phase 4 Booking Domain Architecture (`docs/architecture/booking/booking-domain.md`).
* Phase 4 Availability Policy (`docs/workflows/availability-policy.md`).

## 10. Completion Criteria
* Service layer enforcement restricting initial scheduling to Staff.
* Strict state validation ensuring scheduling only occurs on `unscheduled` bookings (or via the reschedule path for `scheduled` bookings).
* Concurrency controls actively blocking overlapping timeslots.

## 11. Open Questions
* None at this time.

## 12. Approved Business Decisions

### 12.1 Multi-Day Booking Durations
**Approved Decision**
Booking duration is measured in days.
Technicians provide estimated duration in days.

If the estimated duration exceeds the technician's available working hours for a single day:
* The system automatically spans the Booking across multiple working days.
* The Booking remains a single Booking.
* The Request is not split.
* Staff does not manually create multiple Bookings.
* Automatic day allocation must respect:
  * Technician working hours
  * Existing bookings
  * Availability constraints

**Example:**
* **Estimated Duration:** 3 days
* **Result:**
  * Day 1 → Scheduled
  * Day 2 → Scheduled
  * Day 3 → Scheduled
* All represented by a single Booking record.
