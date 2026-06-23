# Calendar Policy

## 1. Purpose
The purpose of this document is to establish the definitive rules governing calendar ownership, visibility, and temporal data management within the Booking domain. It clarifies the distinction between static capacity (working hours) and dynamic utilization (availability).

## 2. Scope
This document covers:
* Calendar and schedule ownership models.
* Working hour configuration boundaries.
* Algorithmic generation of availability.
* Booking placement rules, including multi-day spanning.
* Conflict prevention invariants.
* Visibility boundaries for different actor roles.

## 3. Out of Scope
* Technical integrations with third-party calendars (e.g., Google Calendar, Outlook).
* UI visualization logic (e.g., Gantt charts, week/month views).
* Routing optimization algorithms.

## 4. Definitions
* **Working Hours:** The foundational configuration of days and times a technician is active.
* **Availability:** The dynamically calculated metric representing open, schedulable time.
* **Calendar:** The aggregate view combining Working Hours and existing Bookings.

## 5. Rules

### 5.1 Ownership & Authority
* **Technician owns working hours.** Technicians configure their base capacity during onboarding/registration.
* **Staff schedules bookings.** Only Staff possesses the authority to place an `unscheduled` booking onto the calendar.
* **System derives availability.** Neither Staff nor Technicians "set" availability; it is a strict algorithmic output.

### 5.2 Conflict Prevention
* **One technician may only have one booking at a time.**
* Overlapping bookings are strictly prohibited under all circumstances in the MVP.
* Back-to-back bookings are permitted when the previous booking ends exactly when the next booking begins. There are no mandatory system-generated travel buffers.

### 5.3 Multi-Day Booking Behavior
* Booking duration is measured in DAYS.
* If a technician estimates a duration that exceeds their available working hours for a single day:
  * The system automatically spans the Booking across multiple working days.
  * The Booking remains a single, continuous Booking record.
  * The parent Request is NOT split.
  * Staff does NOT manually create multiple Bookings.
  * The automatic spanning must respect the technician's working hours and jump over existing bookings or off-hours as necessary.

### 5.4 Working Hour Modification Restrictions
* A technician may only modify working hours when:
  * No active assignments exist
  * No accepted assignments exist
  * No scheduled bookings exist
  * No in-progress work exists
* Modification requests violating these conditions must be rejected.

### 5.5 Timezone Policy
* Datetimes are stored in UTC and displayed in user-configured timezones. Availability normalization is required for all calculations.

### 5.6 Blackout Date Precedence
* Technicians may create blackout dates. 
* **Precedence:** Existing Bookings take precedence over new Blackout Dates. Assigned Requests also take precedence over new Blackout Dates.
* **Constraint:** A technician cannot create a blackout date that conflicts with an existing booking or an assigned request awaiting scheduling.

## 6. Required Matrices/Tables

### Calendar Authority and Restriction Matrix

| Actor | Working Hours Control | Scheduling Authority | Visibility Boundary |
| :--- | :--- | :--- | :--- |
| **Technician** | Full Control (Own) | None | Own calendar only |
| **Staff** | Read-Only | Full Control | Organizational view |
| **Customer** | None | None | Specific booking schedule and assigned technician identity only. |
| **Manager** | Override Authority | Full Control | Organizational view |
| **System** | Read-Only | Derives Availability | Global |

## 7. Edge Cases
* **Working Hour Reduction:** A technician reduces their working hours on a day that already contains a `scheduled` booking, causing the booking to fall outside of valid working hours.
* **Timezone Discrepancies:** A Staff member in EST attempting to schedule a Technician in PST, ensuring the system strictly enforces the Technician's local working hours.

## 8. Audit Expectations
* All modifications to a technician's Working Hours must be heavily audited as they directly impact platform capacity.
* The system is not required to log routine availability calculation queries, but must log any scheduling rejections caused by conflict prevention limits.

## 9. Dependencies
* `docs/architecture/booking/booking-domain.md`
* `docs/workflows/availability-policy.md`
* `docs/workflows/scheduling-flow.md`

## 10. Completion Criteria
* Strict encapsulation in the service layer preventing Staff from modifying technician working hours directly without Manager override.
* Implementation of the multi-day spanning logic within the scheduling engine.
* Total prevention of overlapping bookings.

## 11. Open Questions
* None at this time.
