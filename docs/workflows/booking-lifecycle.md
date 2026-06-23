# Booking Lifecycle Workflow

## 1. Purpose
The purpose of this document is to define the definitive state machine and lifecycle workflow for the Booking domain. It outlines the progression of a Booking from its automated creation through its terminal states.

## 2. Scope
This document covers:
* Booking Lifecycle states: `unscheduled`, `scheduled`, `in_progress`, `completed`, `cancelled`, `no_show`.
* Entry and exit criteria for each state.
* Permitted transitions between states.
* Ownership and authority over state transitions.

## 3. Out of Scope
* Request lifecycle states (handled in Phase 3).
* Underlying API designs or database schemas.
* Implementation details of the state machine pattern.

## 4. Definitions
* **Terminal State:** A state from which no further transitions are permitted (`completed`, `cancelled`, `no_show`).
* **Subordinate Lifecycle:** The Booking lifecycle operates within the bounds of the parent Request. If a Request is cancelled, the Booking is inherently cancelled.

## 5. Rules
* A Booking enters the lifecycle exclusively via automated system generation.
* Bookings cannot skip logical temporal states (e.g., cannot move from `unscheduled` directly to `completed`).
* `no_show` forces an automatic transition to cancellation, governed by the Request cancellation policy.

### 5.4 SLA Preservation Policy
* **Source of Truth:** Request SLA remains the sole source of truth.
* **Non-Interference:** Booking operations (scheduling, rescheduling, duration extensions, state changes) never modify or reset Request SLA timers.

### 5.5 Duration Extension & Conflicts
* **Ownership:** The assigned Technician estimates and may subsequently extend the booking duration.
* **Mutation:** Duration extensions update the existing record.
* **Conflict Resolution:** If an extension causes an overlap conflict, it is **Hard Rejected**. There is no automatic displacement, no automatic rescheduling, and no manager override for this conflict.

### 5.6 Completion Source of Truth
* **Authority:** The Request lifecycle remains authoritative.
* **Synchronization:** When a Request reaches completion, the linked Booking is automatically completed. Booking completion does not independently complete a Request.

### 5.7 Technician Unavailability & State Resets
* **Unavailability After Assignment:** If a technician becomes unavailable after assignment, manager reassignment is mandatory. The Booking remains (or becomes) `unscheduled` and the Request remains **active**.
* **Declines After Booking Creation:** If an assignment is removed after a Booking exists, the record remains but returns to the `unscheduled` state. Staff reassignment is required.

## 6. Required Matrices/Tables

### Booking Transition Matrix

| Current State | Permitted Transition (Target State) | Authorized Actor / Trigger | Exit Criteria |
| :--- | :--- | :--- | :--- |
| `[None]` | `unscheduled` | System (Upon Tech Acceptance) | Booking record instantiated |
| `unscheduled` | `scheduled` | Staff | Temporal window allocated |
| `unscheduled` | `cancelled` | Customer, Staff, Manager | Booking abandoned |
| `scheduled` | `in_progress` | Technician | Work begins on-site |
| `scheduled` | `cancelled` | Customer, Staff, Manager | Booking abandoned |
| `scheduled` | `no_show` | Staff, Manager, System | Party fails to attend |
| `in_progress` | `completed` | System (Request Completed) | Parent Request finalized |
| `in_progress` | `cancelled` | Customer, Staff, Manager | Work aborted mid-execution |
| `no_show` | `cancelled` | System | Auto-cancellation execution |
| `completed` | *Terminal* | None | None |
| `cancelled` | *Terminal* | None | None |

## 7. Edge Cases
* **Retroactive State Correction:** If a technician forgets to trigger `in_progress` but completes the work, handling the leap from `scheduled` to `completed`.
* **System-driven Cancellations:** When a parent Request is cancelled by an external integration, ensuring the Booking immediately halts progression and routes to `cancelled`.

## 8. Audit Expectations
* Every state transition must emit a corresponding Domain Event and be logged in the centralized Audit Log, capturing the `from_state`, `to_state`, and the actor responsible.

## 9. Dependencies
* Phase 4 Booking Domain Architecture (`docs/architecture/booking/booking-domain.md`).
* Phase 3 Request Lifecycle (`docs/workflows/request-lifecycle.md`).

## 10. Completion Criteria
* State machine enforcement at the Service boundary rejecting invalid transitions.
* Accurate mapping of the 6 defined states and no undocumented states.

## 11. Open Questions
* None at this time.

## 12. Approved Business Decisions

### 12.1 No-Show Financial Implications
**Approved Decision**
No financial penalty is applied for a no-show in MVP.
No-show is a terminal booking outcome.

When a booking is marked: `no_show`
The associated Request follows the standard cancellation workflow.

The booking lifecycle does not perform:
* Charges
* Penalties
* Automatic fees
* Financial adjustments

Any future penalty policy is outside MVP scope.
