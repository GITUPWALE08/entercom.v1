# Booking Domain Architecture

## 1. Purpose
The purpose of this document is to define the boundaries, rules, and lifecycle integration of the Booking domain within the Entercom platform. It establishes the strict hierarchical relationship between the canonical Request domain and its subordinate Booking entities, ensuring robust scheduling, availability management, and concurrency control.

## 2. Scope
This document covers the architectural rules and domain boundaries for:
* The Request-to-Booking relationship and subordination.
* Automatic Booking Creation rules and prerequisites.
* Scheduling and availability ownership.
* Rescheduling and cancellation policies.
* Double-booking prevention logic.
* Booking applicability mapping based on Request workflow progression.

## 3. Out of Scope
The following are explicitly out of scope for this document:
* Database schema design and entity-relationship diagrams.
* API contract specifications and payload definitions.
* Internal service methods and implementation code.
* Domain event payloads.

## 4. Definitions
* **Request remains the canonical business object.**
* **Booking cannot exist independently.**
* A Request may exist without a Booking. A Booking cannot exist without a Request.
* Booking remains a subordinate object.
* A multi-day engagement is represented as **ONE booking record** covering **MULTIPLE reserved calendar days**. The system MUST NOT create one booking per day.

## 5. Rules

### 5.1 Request → Booking Relationship
* The Request is the primary entity; the Booking is a temporal extension of the Request.
* Bookings only exist to represent the scheduling of a previously established Assignment.
* **Completion Authority:** Request lifecycle remains authoritative. When a Request reaches completion, the linked Booking is completed. Booking completion does not independently complete a Request. This is a one-way synchronization: `Request.completed -> Booking.completed`.

### 5.2 Booking Creation Rule
* A Booking is automatically created when:
  1. A Request has been assigned to a technician.
  2. The Technician explicitly accepts the assignment.
* Workflow progression creates a Booking; the Request category does NOT directly create a Booking without this progression. Requests that never reach technician acceptance never receive a Booking.

### 5.3 Ownership Model
* **Scheduling Ownership:** Scheduling authority is strictly limited to Staff. Customers and Technicians cannot schedule bookings.
* **Availability Ownership:** Availability is dictated by technician working hours, which are defined during technician onboarding and registration.
* **Booking Lifecycle Ownership:** The Booking lifecycle is subordinate to the state of the parent Request.

### 5.4 Rescheduling Policy
* **Allowed Actors:** Customer, Technician, Staff, Manager.
* **Limit:** A maximum of 3 reschedules are permitted per Booking.

### 5.5 Cancellation Policy
* Booking cancellation strictly adheres to the established Request cancellation policy. 

### 5.6 No-Show Handling
* A no-show event results in the automatic cancellation of the Booking (and subsequently the Request, governed by the Request cancellation policy).

### 5.7 Double-Booking Prevention
* Strict concurrency control is required: One technician may have only one Booking at a time. Overlapping bookings for the same technician are absolutely prohibited.

### 5.8 Booking Duration
* Duration is initially estimated by the assigned technician and may be extended later if required by the scope of work.

### 5.9 Timezone Policy
* **Storage:** All booking datetimes are stored in UTC.
* **Display:** Datetimes are displayed in the user's configured timezone.
* **Normalization:** Technician availability is maintained in the technician's configured timezone and normalized to UTC before scheduling calculations.

### 5.10 Blackout Date Policy
* **Creation:** Technicians may create blackout dates.
* **Precedence:** Existing bookings take precedence. A blackout date cannot be created if it conflicts with an existing booking.
* **Enforcement:** Bookings cannot be scheduled during blackout dates.

### 5.11 Emergency Booking Policy
* **Scheduling Bounds:** Emergency requests cannot be scheduled outside technician working hours.
* **Assignment Requirement:** Emergency requests still require technician assignment.
* **Displacement:** Emergency requests do not automatically cancel or displace existing bookings. Manager intervention is mandatory for manual displacement; the system never performs automatic displacement.

### 5.12 SLA Preservation Policy
* **Independence:** Booking operations (scheduling, rescheduling, duration extensions, state changes) never modify Request SLA timers or reset calculations.
* **Authority:** Request SLA remains the sole source of truth.

### 5.13 Capacity Reservation Policy
* **Reservation:** A booking reserves technician capacity across every scheduled day.
* **Exclusivity:** No overlapping booking may exist during any reserved period. A technician may only have one active booking during a reserved time window.

## 6. Required Matrices/Tables

### Booking Applicability by Request Category

| Request Category | Booking Creation Trigger |
| :--- | :--- |
| `installation` | Booking created after technician acceptance |
| `inspection` | Booking created after technician acceptance |
| `maintenance` | Booking created after technician acceptance |
| `consultation` | Booking created after technician acceptance |
| `warranty` | Booking created after technician acceptance |
| `support` | No booking |
| `information` | No booking |
| `product_order` | No booking |

## 7. Edge Cases
* **Duration Extensions:** How overlapping boundaries are handled if a technician extends a duration into an adjacent, pre-existing Booking window.
* **Maximum Reschedules Met:** System behavior when an actor attempts a 4th reschedule.
* **Tech Availability Changes:** Impact on existing `scheduled` bookings if a technician alters their core working hours post-assignment.

## 8. Audit Expectations
* All scheduling events (creation, scheduling, rescheduling, cancellation, no-show declarations) must be immutably logged with the actor and correlation ID, bridging the Request and Booking audit trails.

## 9. Dependencies
* Phase 3 Request Architecture (`docs/architecture/request/request-domain.md`)
* Phase 3 Assignment Policy (`docs/workflows/assignment-policy.md`)
* Phase 3 Cancellation Policy (`docs/workflows/cancellation-policy.md`)

## 10. Implementation References
* `docs/implementation/booking/booking-model-design.md`
* `docs/implementation/booking/booking-implementation-index.md`

## 11. Completion Criteria
* Implementation of the Booking entity strictly as a subordinate to Request.
* Enforcement of the Automatic Booking Creation rule tied exactly to technician acceptance.
* Enforcement of the Double-Booking Prevention guardrails in the service layer.
* Enforcement of the Scheduling Ownership boundaries (Staff only).
* Enforcement of the 3-reschedule limit across all permitted actors.

## 11. Open Questions
* UNRESOLVED — BUSINESS DECISION REQUIRED: If a Booking duration is extended, forcing a conflict with the technician's next scheduled Booking, does the system automatically unassign the conflicting Request, or block the extension?
* UNRESOLVED — BUSINESS DECISION REQUIRED: Does a reschedule count increment if a Manager reschedules the Booking on behalf of the business, as opposed to a Customer/Technician request?
