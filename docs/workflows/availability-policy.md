# Technician Availability Policy

## 1. Purpose
The purpose of this document is to define how Technician availability is calculated, bounded, and enforced within the Booking domain. It serves as the canonical rulebook for preventing schedule conflicts and managing workforce capacity.

## 2. Scope
This document covers:
* The ownership and definition of Working Hours.
* The algorithmic determination of Availability.
* The rules governing booking conflict prevention.

## 3. Out of Scope
* Paid time off (PTO), sick leave, or holiday exception logic.
* Geo-spatial routing or travel-time calculations between sequential bookings.
* Database query optimization for schedule lookups.

## 4. Definitions
* **Working Hours:** The baseline days and times a technician is available for dispatch.
* **Availability:** The real-time capacity of a technician to take on new work.

## 5. Rules

### 5.1 Working Hours Ownership
* Working hours are defined during technician onboarding and registration.
* These hours act as the absolute outer boundary for any permissible scheduling.

### 5.2 Availability Determination
* **Availability is derived from working hours and existing bookings.**
* Algorithmically: `Availability = (Working Hours) - (Existing Scheduled Bookings)`.
* A technician is considered unavailable during any period that falls outside their defined working hours or overlaps with a committed Booking.

### 5.3 Overlapping Booking Prohibition
* **One technician may only have one booking at a time.**
* Overlapping bookings are strictly prohibited. There are no exceptions for "soft" double-booking or overbooking in the MVP.

### 5.4 Scheduling Validation Requirements
* Before any Booking transitions to `scheduled`, the system must query the technician's availability.
* If the proposed booking duration exceeds the available continuous block, the scheduling action must be rejected.

### 5.5 Timezone Normalization
* Technician availability is calculated using normalized UTC datetimes derived from the technician's configured timezone.

### 5.6 Blackout Dates
* Technicians may define blackout dates which act as absolute exclusions for availability calculations.
* **Precedence:** Existing Bookings take precedence over new Blackout Dates. Assigned Requests also take precedence over new Blackout Dates.
* **Conflict Prevention:** A technician cannot create a blackout date that conflicts with an existing booking or an assigned request awaiting scheduling.

### 5.7 Capacity Reservation
* Availability calculation must treat every day of a multi-day booking as a reserved block. Overlapping bookings are prohibited across the entire span.

## 6. Required Matrices/Tables

### Availability Calculation Example

| Factor | Description | Output Status for Timeslot |
| :--- | :--- | :--- |
| Outside Working Hours | E.g., 8:00 PM when hours end at 5:00 PM | **Unavailable** |
| Inside Working Hours | E.g., 10:00 AM | **Potentially Available** |
| Existing Booking Present | Booking scheduled 9:00 AM - 11:00 AM | **Unavailable (Conflict)** |
| No Existing Bookings | Gap from 11:00 AM - 1:00 PM | **Available** |

## 7. Edge Cases
* **Minute-Level Granularity:** Determining if a booking ending at exactly 1:00 PM allows the next booking to start at exactly 1:00 PM, or if buffer padding is required.
* **Mid-Booking Schedule Changes:** A technician altering their permanent working hours in a way that suddenly invalidates a previously scheduled booking residing in the future.

## 8. Audit Expectations
* Changes to base working hours must be audited as critical user profile mutations.
* Any system rejection due to an availability conflict should optionally emit a metric for capacity constraint analysis, though strict audit logging is not required for denied scheduling attempts.

## 9. Dependencies
* Phase 4 Booking Domain Architecture (`docs/architecture/booking/booking-domain.md`).
* Phase 4 Scheduling Flow (`docs/workflows/scheduling-flow.md`).

## 10. Completion Criteria
* Implementation of a deterministic availability evaluation mechanism in the service layer.
* Absolute enforcement of the one-booking-at-a-time rule.

## 11. Open Questions
* None at this time.

## 12. Approved Business Decisions

### 12.1 No Mandatory Buffer Time
**Approved Decision**
No mandatory system-generated buffer exists between bookings.

Availability is determined exclusively by:
* Technician working hours
* Existing bookings

The scheduling engine must prevent overlapping bookings.
Back-to-back bookings are permitted when:
* The previous booking ends at time T
* The next booking starts at time T

Travel time is an operational concern and is not modeled by the MVP scheduling system.

