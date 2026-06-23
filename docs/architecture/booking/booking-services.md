# Booking Service Architecture

## 1. Purpose
The purpose of this document is to define the logical service boundaries and responsibilities within the Booking domain. It establishes how booking-related business logic is encapsulated, ensuring strict adherence to the approved workflows without bleeding into the presentation or data access layers.

## 2. Scope
This document covers:
* The core domain services responsible for Booking orchestration.
* Cross-domain interaction rules between Booking and Request domains.
* Enforcement responsibilities for availability, scheduling, and duration rules.

## 3. Out of Scope
* Service method signatures, class definitions, and implementation code.
* Database query optimization strategies.
* API endpoints or controller logic.

## 4. Definitions
* **Service Boundary:** The logical separation of business logic encapsulating specific domain operations.
* **Orchestration:** The coordination of multiple domain rules (e.g., availability checks, duration spanning) to achieve a valid business outcome.

## 5. Detailed Sections

### 5.1 Booking Lifecycle Service
Responsible for the automated creation and state progression of a Booking.
* **Creation:** Must automatically instantiate a Booking (status = `unscheduled`) explicitly listening to the technician assignment acceptance trigger from the Request domain.
* **SLA Delegation:** Enforces the rule that a Booking possesses no independent SLA. Must defer all SLA calculations and triggers entirely to the parent Request SLA policy.
* **Duration Extension:** The assigned Technician may extend the booking duration. Extensions do not create new bookings; they update the existing record.
* **Completion Authority:** Enforces the rule that Request lifecycle remains authoritative. When a Request reaches completion, this service must automatically transition the linked Booking to `completed`. Booking completion does not independently complete a Request.
* **Cancellation Sync:** Orchestrates the transition to `cancelled` strictly based on the parent Request's cancellation workflow.

### 5.2 Scheduling & Calendar Service
Responsible for the temporal placement of Bookings on a technician's calendar.
* **Locking Strategy:** Scheduling operations MUST execute within a database transaction. Technician availability MUST be revalidated inside the transaction before booking confirmation.
* **Overlap Prevention:** The system MUST reject overlapping bookings even if the conflict was not visible during initial availability lookup. Database constraints and transactional locking are authoritative. The first successful committed transaction wins.
* **Multi-Day Spanning:** If an estimated duration exceeds a single day's working hours, this service orchestrates the seamless spanning across subsequent working days while retaining a single Booking record.
* **Conflict Prevention:** Acts as the absolute gatekeeper against double-booking. Rejects any scheduling operation that creates an overlap for a single technician.
* **Buffer Enforcement:** Enforces the rule that no system-generated travel buffers are applied; back-to-back contiguous scheduling is explicitly permitted.

### 5.3 Rescheduling & Capacity Service
* **Reschedule Tracking:** Maintains and validates the maximum reschedule limit (3 per booking).
* **Availability Resolution:** Derives real-time availability exclusively from technician working hours minus existing scheduled bookings.

### 5.4 AvailabilityService Responsibilities
* **create_blackout_date:** Allows an authorized actor to define a period of unavailability for a technician.
  * **Purpose:** Blocks off time to prevent scheduling overlaps.
  * **Inputs:** Technician ID, Start Time, End Time.
  * **Outputs:** BlackoutDate entity.
  * **Audit Requirements:** Log blackout creation, actor, and temporal window.
  * **Events Produced:** `availability.blackout_created`
* **delete_blackout_date:** Allows an authorized actor to remove a period of unavailability.
  * **Purpose:** Frees up time for scheduling.
  * **Inputs:** BlackoutDate ID.
  * **Outputs:** Success/Failure confirmation.
  * **Audit Requirements:** Log blackout deletion and actor.
  * **Events Produced:** `availability.blackout_deleted`

## 6. Dependencies
* `docs/architecture/booking/booking-domain.md`
* `docs/workflows/availability-policy.md`
* `docs/workflows/scheduling-flow.md`

## 7. Implementation References
* `docs/implementation/booking/booking-service-design.md`

## 8. Open Questions
* None at this time.

## 8. Completion Criteria
* Service boundaries cleanly encapsulate all scheduling, availability, and multi-day spanning logic without exposing implementation details to the outer layers.
* Integration tests verify that Request category alone does not trigger Booking creation without technician acceptance.
