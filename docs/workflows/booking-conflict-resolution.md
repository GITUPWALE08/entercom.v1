# Booking Conflict Resolution

## 1. Purpose
The purpose of this document is to centralize and define the system's behavior when temporal or operational conflicts occur within the Booking domain. It establishes the authoritative resolution logic for double-bookings, capacity constraints, and unexpected technician unavailability, ensuring predictable outcomes across all actor roles.

## 2. Scope
This document covers the resolution protocols for:
* Double-booking conflicts.
* Duration extension conflicts.
* Blackout date conflicts.
* Emergency scheduling conflicts.
* Technician reassignment conflicts (unavailability/declines).

## 3. Out of Scope
* Geo-spatial routing conflicts.
* Financial or billing disputes arising from conflicts.
* User interface design for conflict alerts.

## 4. Definitions
* **Hard Rejection:** A system state where a requested mutation is blocked and the previous valid state is preserved.
* **Displacement:** The act of removing or moving an existing booking to accommodate a new one (Explicitly prohibited from being automated in MVP).

## 5. Detailed Sections

### 5.1 Double-Booking Conflicts
* **Trigger:** Staff attempts to schedule or any actor attempts to reschedule a booking into an occupied slot.
* **Validation:** `AvailabilityService` performs a transactional check against the technician's existing `scheduled` and `in_progress` bookings.
* **Resolution:** **Hard Rejection.** The system blocks the commit and returns a concurrency conflict error.
* **Final Outcome:** The booking remains in its previous state (`unscheduled` or its original `scheduled` window).

### 5.2 Duration Extension Conflicts
* **Trigger:** Technician attempts to extend the duration of an existing booking.
* **Validation:** `AvailabilityService` checks the requested extension against subsequent bookings on the technician's calendar.
* **Resolution:** **Hard Rejection.** If the extension overlaps with any existing commitment, the request is rejected.
* **Final Outcome:** No automatic displacement or rescheduling occurs. No manager override is permitted for this validation. The extension is blocked.

### 5.3 Blackout Date Conflicts
* **Trigger:** Technician attempts to create a blackout date.
* **Validation:** `AvailabilityService` checks for overlaps with existing `scheduled` bookings or assigned Requests awaiting scheduling.
* **Resolution:** **Hard Rejection.** Existing operational commitments take precedence.
* **Final Outcome:** Blackout date creation is rejected.

### 5.4 Emergency Scheduling Conflicts
* **Trigger:** An Emergency Request requires scheduling but no technicians have open availability.
* **Validation:** `AvailabilityService` confirms total capacity saturation within working hours.
* **Resolution:** **Queueing.** The system rejects automatic displacement of existing bookings.
* **Final Outcome:** The Booking remains `unscheduled`. The Request continues through its normal lifecycle (e.g., SLA monitoring) and will eventually expire or cancel according to Phase 3 rules if no technician is assigned/scheduled.

### 5.5 Technician Reassignment Conflicts

#### 5.5.1 Unavailability After Assignment
* **Trigger:** Assigned technician becomes unavailable before a booking is scheduled.
* **Validation:** N/A (Actor-driven).
* **Resolution:** **Manager Reassignment.** Manager intervention is mandatory to re-route the work.
* **Final Outcome:** The Booking remains `unscheduled`. The Request remains **active** (not cancelled).

#### 5.5.2 Decline After Booking Exists
* **Trigger:** Assignment is removed (e.g., tech declines or is unassigned) after a Booking record has already been instantiated.
* **Resolution:** **State Reset.** The existing booking record is preserved but transitions to (or remains) `unscheduled`.
* **Final Outcome:** Staff reassignment is required. The Request remains active.

## 6. Required Matrices/Tables

### Conflict Precedence Matrix

| Conflict Type | Priority 1 (Precedence) | Priority 2 (Blocked) |
| :--- | :--- | :--- |
| **Schedule vs. Blackout** | Existing Booking | New Blackout Date |
| **Extension vs. Next Booking** | Next Booking | Duration Extension |
| **Emergency vs. Standard** | Existing Booking | Emergency Request (Automatic) |
| **Assignment vs. Blackout** | Assigned Request | New Blackout Date |

## 7. Edge Cases
* **Concurrent Reassignment:** Two managers attempting to reassign the same conflicted request simultaneously (Resolved by row-level locking in `BookingService`).

## 8. Audit Expectations
* Every conflict-driven rejection must be logged in the Audit Log with the reason code (e.g., `conflict.double_booking`, `conflict.blackout_precedence`).

## 9. Dependencies
* `docs/architecture/booking/booking-domain.md`
* `docs/architecture/booking/booking-services.md`
* `docs/workflows/availability-policy.md`
* `docs/workflows/scheduling-flow.md`
* `docs/workflows/booking-lifecycle.md`

## 10. Completion Criteria
* All conflict resolution logic is implemented as transactional guards in the Service Layer.
* Zero scenarios exist where the system automatically deletes or moves a committed booking without explicit human (Manager) intervention.
* **Completion Integrity:** System confirms that Booking completion is strictly a downstream effect of Request completion. No logic exists to propagate a Booking `completed` state back to the parent Request.

## 11. Open Questions
* None at this time.
