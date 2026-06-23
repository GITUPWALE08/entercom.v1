# Rescheduling Workflow

## 1. Purpose
The purpose of this document is to define the definitive process for altering the temporal window of an existing scheduled booking. It establishes the limits, authorization boundaries, and validation requirements necessary to safely reschedule an appointment without violating technician availability or concurrency rules.

## 2. Scope
This document covers:
* Authorized actors permitted to trigger a reschedule.
* The sequential steps of the rescheduling process.
* Hard limits on reschedule frequency.
* Real-time availability and conflict re-validation.
* Event emission and audit requirements for schedule mutation.

## 3. Out of Scope
* Initial scheduling processes (covered in `scheduling-flow.md`).
* User Interface (UI) design for calendar interactions.
* Email or SMS notification templates and delivery mechanisms.

## 4. Definitions
* **Reschedule:** The act of mutating the `booking window` (start and/or end date/time) of a Booking currently in the `scheduled` state.
* **Reschedule Count:** An integer value tracked against a Booking that increments upon each successful reschedule action.

## 5. Rules

### 5.1 Authorization & Initiation
* A reschedule may be initiated by the following actors:
  * Customer
  * Technician
  * Staff
  * Manager

### 5.2 Rescheduling Limits
* **Maximum reschedules per Booking: 3**
* Three reschedules is a **hard system limit**. Any attempt to reschedule a booking for a 4th time must be strictly rejected. There is no manager, staff, or customer override for this limit.

### 5.3 Validation Requirements
* Every reschedule attempt triggers the same rigorous validation as an initial scheduling event.
* **Availability Re-validation:** The proposed new booking window must fit within the assigned technician's working hours.
* **Technician Conflict Checks:** The system must enforce the "One technician may only have one booking at a time" rule. The proposed window cannot overlap with any other `scheduled` or `in_progress` booking for that technician.

### 5.4 Multi-Day Handling during Reschedule
* If a reschedule alters a multi-day booking, the system must recalculate the spanning logic to ensure all affected days remain compliant with working hours and do not create overlaps.

### 5.5 Approval Requirements
* In the MVP, a valid reschedule requested by an authorized actor that passes all availability and conflict checks is automatically approved and executed by the system. No secondary manual approval loop is required.

## 6. Required Matrices/Tables

### Rescheduling Flow Diagram

```text
[Actor Initiates Reschedule]
       |
       v
[System Checks Reschedule Count <= 3] ---> (Fail) ---> [Reject Request: Limit Reached]
       |
    (Pass)
       |
       v
[System Checks Technician Availability] ---> (Fail) ---> [Reject Request: Outside Hours]
       |
    (Pass)
       |
       v
[System Checks Conflict / Overlap] ---> (Fail) ---> [Reject Request: Double Booking]
       |
    (Pass)
       |
       v
[Update Booking Window]
       |
       v
[Increment Reschedule Count]
       |
       v
[Emit Rescheduled Domain Event]
       |
       v
[End]
```

## 7. Edge Cases
* **In-Progress Rescheduling:** System behavior if a user attempts to reschedule a booking that has already transitioned to `in_progress`. (Rule: Must be rejected; only `scheduled` bookings can be rescheduled).
* **Manager Override:** Whether a Manager can override the hard 3-reschedule limit for extreme business exceptions. (Rule: Not permitted in MVP).

## 8. Audit Expectations
* Every reschedule attempt (successful or rejected) must be logged.
* Successful reschedules must log the `previous_window`, `new_window`, the `actor` who initiated it, and the new `reschedule_count`.
* Domain events (e.g., `booking.rescheduled`) must be emitted to trigger downstream notifications.

## 9. Dependencies
* `docs/architecture/booking/booking-domain.md`
* `docs/workflows/availability-policy.md`
* `docs/workflows/booking-lifecycle.md`

## 10. Completion Criteria
* Service layer enforcement of the 3-reschedule limit.
* Full integration of the Availability and Conflict validation logic into the reschedule mutation method.
* Comprehensive audit logging of the time alteration.

## 11. Open Questions
* None at this time.

## 12. Approved Business Decisions

### 12.1 Absolute Reschedule Limit
**Approved Decision**
The maximum of 3 reschedules is a hard system limit enforced per Booking, regardless of which actor (Customer, Technician, Staff, or Manager) initiates the change.
 "Customer allowance"?
