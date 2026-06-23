# Booking State Machine

## 1. Purpose
The purpose of this document is to define the definitive state machine governing the lifecycle of a Booking. It dictates the valid states, transition pathways, and the strict guard conditions required to move between them.

## 2. Scope
This document covers:
* The finite list of valid Booking lifecycle states.
* Approved state transitions.
* Guard conditions, including refund prerequisites and grace periods.

## 3. Out of Scope
* Request lifecycle states.
* Code implementation of the state machine (e.g., transition decorators).
* Database column definitions for state persistence.

## 4. Definitions
* **Guard Condition:** A business rule that must evaluate to true before a state transition is permitted.
* **Terminal State:** A state from which no further transitions can occur.

## 5. Detailed Sections

### 5.1 Valid Lifecycle States
The Booking domain strictly recognizes the following states:
* `unscheduled` (Initial state upon creation)
* `scheduled`
* `in_progress`
* `completed` (Terminal)
* `cancelled` (Terminal)
* `no_show` (Terminal)

### 5.2 Transition Pathways and Guard Conditions

#### Creation → `unscheduled`
* **Trigger:** Technician accepts Request assignment.
* **Guard:** Request must be in a valid assigned state. Booking cannot be created directly by category without acceptance. The system MUST NOT persist one BookingDay record per reserved day.
Reserved days are derived from Booking temporal boundaries.

#### `unscheduled` → `scheduled`
* **Trigger:** Staff executes scheduling action.
* **Guard:** Must pass double-booking overlap checks. Duration must be validly spanned across working days.

#### `scheduled` → `scheduled` (Reschedule)
* **Trigger:** Customer, Technician, Staff, or Manager alters booking window.
* **Guard:** `reschedule_count` must be < 3. Must pass availability re-validation.

#### `scheduled` → `in_progress`
* **Trigger:** Technician begins work.
* **Guard:** Current time must align with the scheduled window (within permitted operational variances).

#### `scheduled` / `in_progress` → `no_show`
* **Trigger:** Technician or Staff declares absence.
* **Guard:** **2-Hour Grace Period.** The system must strictly reject the transition if less than 2 hours have elapsed since the scheduled booking start time.

#### `in_progress` → `completed`
* **Trigger:** Parent Request reaches completion.
* **Guard:** None (Subordinate synchronization).

#### Any Active State → `cancelled`
* **Trigger:** Request cancellation workflow.
* **Guard:** **Refund Rule.** If the cancellation requires a refund, the Manager cancellation approval transition is blocked until successful refund completion is confirmed. The Booking canonical state remains unchanged (does not enter a custom refund state) until final approval.

## 6. Dependencies
* `docs/workflows/booking-lifecycle.md`
* `docs/workflows/no-show-policy.md`
* `docs/workflows/booking-cancellation-policy.md`

## 7. Implementation References
* `docs/implementation/booking/booking-service-design.md`
* `docs/implementation/booking/booking-test-strategy.md`

## 8. Open Questions
* None at this time.

## 8. Completion Criteria
* The state machine strictly rejects transitions violating the 3-reschedule limit, 2-hour no-show grace period, and refund dependency blocks.
* No undocumented states exist within the Booking lifecycle.
