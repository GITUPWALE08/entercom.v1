# No-Show Policy

## 1. Purpose
The purpose of this document is to define the workflow and consequences of a "no-show" event within the Booking domain. It establishes the terminal nature of a no-show and dictates how the associated Request is handled subsequently.

## 2. Scope
This document covers:
* Defining Customer and Technician no-shows.
* The sequence of actions for detecting, recording, reviewing, and closing a no-show.
* The impact of a no-show on the Booking and Request lifecycles.
* The explicit absence of financial penalties in the MVP.

## 3. Out of Scope
* Automated geolocation or geofencing implementations to prove presence.
* Re-billing or penalty invoicing (explicitly excluded from MVP).
* Notification delivery mechanisms.

## 4. Definitions
* **No-Show:** An event declared when a required party (Customer or Technician) fails to be present or available during the scheduled booking window.

## 5. Rules

### 5.1 No-Show Fundamentals
* **No-show is a terminal booking outcome.**
* **No financial penalty in MVP.** The booking lifecycle does not perform charges, penalties, automatic fees, or financial adjustments.
* When a booking is marked as a no-show, its state transitions immediately to `no_show`.

### 5.2 Consequential Lifecycle Impact
* Because a Booking cannot exist independently of its Request, a `no_show` declaration on the Booking forces the parent Request to follow the standard cancellation workflow. The Request is effectively aborted due to non-attendance.

### 5.3 Detection and Recording
* In the MVP, a no-show is recorded via manual action by authorized personnel (Staff, Manager, or the attending Technician reporting the other party's absence).

## 6. Required Matrices/Tables

### No-Show Workflow Matrix

| Stage | Action Description | Authorized Actor | Outcome |
| :--- | :--- | :--- | :--- |
| **Detection** | Identification that a party is missing during the booking window. | Technician, Staff | System notified |
| **Recording** | Formal submission of the no-show status against the Booking. | Technician, Staff | Booking state transitions to `no_show` |
| **Review** | Managerial oversight of the no-show event (optional). | Manager | N/A |
| **Closure** | Automated consequence execution. | System | Request transitions to `cancelled` |

### No-Show Decision Matrix

| Absent Party | Reporting Party | Immediate Booking State | Consequential Request State | MVP Financial Penalty |
| :--- | :--- | :--- | :--- | :--- |
| Customer | Technician / Staff | `no_show` | `cancelled` | None |
| Technician | Customer / Staff | `no_show` | `cancelled` | None |
| Both | Staff | `no_show` | `cancelled` | None |

## 7. Edge Cases
* **False Positives:** A Technician reports a Customer no-show, but the Customer was present at a slightly incorrect address due to a system typo. Handling the reversal of a terminal `no_show` state.
* **Grace Periods:** Defining exactly how late into the booking window a party can be before a no-show can legally be recorded.

## 8. Audit Expectations
* The declaration of a `no_show` must be heavily audited, capturing the exact timestamp, the actor recording it, and the party flagged as absent.
* The cascading cancellation of the parent Request must be audited with a correlation ID linking it directly to the Booking's no-show event.

## 9. Dependencies
* `docs/architecture/booking/booking-domain.md`
* `docs/workflows/booking-lifecycle.md`
* Phase 3 Cancellation Policy (`docs/workflows/cancellation-policy.md`)

## 10. Completion Criteria
* Service layer implementation of the `no_show` state transition on the Booking entity.
* Implementation of the automated cascade effect triggering the Request cancellation workflow upon no-show.
* Validation that no billing or penalty logic executes during this transition.

## 11. Open Questions
* None at this time.

## 12. Approved Business Decisions

### 12.1 Customer No-Show Grace Period
**Approved Decision**
A technician must wait a minimum of 2 hours after the scheduled booking start time before recording a customer no-show.

The technician may not record:
* `no_show`
* `unavailable_customer`
* `customer_absent`

before the 2-hour waiting period expires.

After the waiting period:
* Technician may submit no-show evidence.
* Staff may review and confirm.
* Booking transitions to `no_show`.
* Request follows the standard cancellation workflow. -> Ans: explicitly 2 hours.