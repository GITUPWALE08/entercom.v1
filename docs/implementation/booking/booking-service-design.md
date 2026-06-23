# Booking Service Implementation Design

## 1. Purpose
The purpose of this document is to translate the Booking Domain Architecture into concrete Service Layer responsibilities. It defines the discrete boundaries, transactional requirements, and event orchestration duties for each service managing the Booking lifecycle.

## 2. Scope
This document covers the design of the following core services:
* BookingService
* SchedulingService
* AvailabilityService
* NoShowService

## 3. Out of Scope
* Actual Python/Django code generation.
* Method signatures and type hinting.
* API viewsets or serializer design.

## 4. Definitions
* **Transaction Boundary:** The strict database transaction block (`@transaction.atomic`) ensuring atomic operations and preventing dirty reads/writes.
* **Event Ownership:** The specific domain events a service is authorized to emit upon successful commit.

## 5. Detailed Sections

### 5.1 BookingService
* **Purpose:** Orchestrates the creation and overarching lifecycle transitions of a Booking entity.
* **Responsibilities:** 
  * Automatically creates the Booking (`BookingService.create_unscheduled_booking()`) when triggered by a Technician's assignment acceptance. 
  * Synchronizes the Booking completion state with the parent Request lifecycle.
  * Handles duration extensions.
  * Manages cancellation sync.
* **Transaction Boundaries:** Atomic creation and terminal state transitions.
* **Notification Rule:** Must never directly send notifications (email, sms, etc.). Emit Domain Events only.
* **Event Ownership:** `booking.created`, `booking.duration_extended`, `booking.in_progress`, `booking.completed`, `booking.cancelled`.
* **Audit Ownership:** `booking.created`, `booking.duration_extended`, `booking.in_progress`, `booking.completed`, `booking.cancelled`.

### 5.2 SchedulingService
* **Purpose:** Handles the temporal assignment and subsequent alterations of a Booking on a Technician's calendar.
* **Responsibilities:** 
  * **Initial Scheduling:** Owns the first assignment of a window to an `unscheduled` booking.
  * **Rescheduling:** Handles alterations to existing windows. Verifies the reschedule limit is strictly <= 3. 
  * **Schedule Validation:** Re-validates the temporal window inside a transaction before commit.
  * **Rule:** MUST consume `AvailabilityService` for all capacity checks; MUST NOT independently calculate availability.
* **Transaction Boundaries:** Atomic update of Booking temporal fields, increment of reschedule counter, and creation of Reschedule Records.
* **Notification Rule:** Emit Domain Events only.
* **Event Ownership:** `booking.scheduled`, `booking.rescheduled`.
* **Audit Ownership:** `booking.scheduled`, `booking.rescheduled`.

### 5.3 AvailabilityService
* **Purpose:** Centralized engine for capacity calculation and conflict detection.
* **Responsibilities:** 
  * Owns working hours, blackout dates, and slot generation.
  * Performs all conflict detection and availability calculations.
  * **AvailabilityService.create_blackout_date:**
    * **Validation Rules:** Must validate end_time > start_time.
    * **Conflict Checks:** System must reject any BlackoutDate that overlaps with an existing `scheduled` or `in_progress` Booking for the same technician. Must use transaction and row-level locking.
    * **Ownership Rules:** IDOR validation: Must match the requested technician_id unless Manager.
    * **Permission Requirements:** Technician (Self), Manager (`calendar.manage_blackouts`).
  * **AvailabilityService.delete_blackout_date:**
    * **Validation Rules:** Must exist.
    * **Ownership Rules:** IDOR validation: Must match the blackout date's technician_id unless Manager.
    * **Permission Requirements:** Technician (Self), Manager (`calendar.manage_blackouts`).
* **Event Ownership:** `availability.working_hours_updated`, `availability.blackout_created`, `availability.blackout_deleted`.
* **Audit Ownership:** `calendar.working_hours_modification`, `conflict.double_booking`, `conflict.blackout_precedence`, `blackout.created`, `blackout.deleted`.

### 5.4 NoShowService
* **Purpose:** Processes and records the terminal absence of a required party.
* **Responsibilities:** Validates the strict 2-hour grace period before permitting a no-show declaration. Generates a No-Show Record. Transitions the Booking to the terminal `no_show` state. Signals the parent Request to initiate the cancellation workflow.
* **Inputs:** Booking ID, Absent Party Identifier, Actor ID.
* **Outputs:** Terminal Booking ID, Cancelled Request ID.
* **Transaction Boundaries:** Atomic update of the Booking state, creation of the No-Show Record, and downstream execution of Request cancellation.
* **State Ownership:** `scheduled` or `in_progress` -> `no_show`
* **Event Ownership:** `booking.no_show`
* **Audit Ownership:** `booking.no_show`, capturing the 2-hour grace period compliance.
* **Permission Requirements:** Technician, Staff, Manager.

### 5.5 Background Jobs
* **BookingReminderJob:**
    * **Purpose:** Sends periodic reminders to Customers and Technicians.
    * **Trigger:** 24h and 3h before `start_time`.
    * **Event Ownership:** `booking.reminder_sent`.
    * **Audit Ownership:** N/A (Routine Notification).

## 6. Dependencies
* `docs/architecture/booking/booking-services.md`
* `docs/architecture/booking/booking-permissions.md`

## 7. Open Questions
* None at this time.

## 8. Completion Criteria
* Service designs explicitly allocate the responsibilities to prevent logic duplication (e.g., Availability is centrally managed).
* Transaction boundaries and Event/State ownership are unambiguously defined for each service.
