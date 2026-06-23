# Booking Events Architecture

## 1. Purpose
The purpose of this document is to define the Domain Events emitted by the Booking domain. It establishes the architectural expectation for how Booking state mutations broadcast asynchronous notifications to decoupled system components without exposing payload schemas.

## 2. Scope
This document covers:
* The taxonomy of permitted Booking domain events.
* The triggers that cause these events to be emitted.
* Transactional guarantees for event dispatch.

## 3. Out of Scope
* JSON payload structures and field definitions.
* Infrastructure choices (e.g., RabbitMQ, Redis Streams, Kafka).
* Event consumption logic in external bounded contexts.

## 4. Definitions
* **Domain Event:** A historical, immutable record indicating that a businessly significant action has occurred within the Booking domain.

## 5. Detailed Sections

### 5.1 Transactional Guarantees
* All Booking domain events must be dispatched strictly post-database commit. If a scheduling transaction fails or rolls back, no event is emitted to the wider system.

### 5.2 Approved Event Taxonomy
The Booking domain is restricted to emitting the following events:

* **`booking.created`**
  * **Trigger:** System instantiates the `unscheduled` Booking upon Technician assignment acceptance.
* **`booking.scheduled`**
  * **Trigger:** Staff successfully assigns a temporal window to an `unscheduled` Booking.
* **`booking.rescheduled`**
  * **Trigger:** An authorized actor alters the temporal window of an existing `scheduled` booking (incrementing the reschedule count).
* **`booking.duration_extended`**
  * **Trigger:** Technician extends the estimated completion time.
* **`booking.in_progress`**
  * **Trigger:** Technician transitions the Booking to active execution.
* **`booking.completed`**
  * **Trigger:** Parent Request transitions to the `completed` state.
* **`booking.no_show`**
  * **Trigger:** A no-show is recorded after the mandatory 2-hour grace period expires.
* **`booking.cancelled`**
  * **Trigger:** The Booking is terminated as a downstream effect of the parent Request cancellation workflow (post-refund verification, if applicable).
* **`availability.working_hours_updated`**
  * **Trigger:** Technician (or Manager override) successfully modifies the baseline capacity configuration.
* **`availability.blackout_created`**
  * **Trigger:** Technician (or Manager) creates a new blackout date.
* **`availability.blackout_deleted`**
  * **Trigger:** Technician (or Manager) deletes an existing blackout date.

### 5.3 System & Infrastructure Events
While not representing a core Booking state transition, the following events are emitted by the platform to support orchestration:

* **`booking.reminder_sent`**
  * **Trigger:** Automated job successfully dispatches a scheduled reminder (24h/3h).

### 5.4 SLA Event Delegation
* The Booking domain explicitly does NOT emit SLA warning or breach events. All SLA-related event orchestration remains the strict responsibility of the Request domain.

## 6. Dependencies
* `docs/architecture/booking/booking-state-machine.md`
* `docs/architecture/request/request-domain.md`

## 7. Implementation References
* `docs/implementation/booking/booking-event-contracts.md`

## 8. Open Questions
* None at this time.

## 8. Completion Criteria
* An exhaustive list of the 7 permitted events is integrated into the event registry.
* Event emission is strictly bound to successful state machine transitions.
