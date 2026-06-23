# Booking Test Strategy

## 1. Purpose
The purpose of this document is to define the comprehensive testing strategy for the Booking domain. It ensures that all architectural invariants, security boundaries, and temporal business rules are rigorously verified before deployment. This strategy mandates multi-layered validation, from low-level state transitions to end-to-end real-time event propagation.

## 2. Scope
This document covers the testing requirements for:
* **Unit Testing:** Models, Services, State Machines, Permissions, and Auditing.
* **Integration Testing:** Cross-service orchestration, API contracts, and WebSocket broadcasts.
* **E2E Testing:** Critical user journeys (Scheduling, Rescheduling, No-Show).
* **Security Testing:** RBAC enforcement, IDOR prevention, and access revocation.
* **Concurrency Testing:** Double-booking prevention and race condition handling.
* **Event & Audit Testing:** Contract validation and forensic traceability.
* **Background Job Testing:** No-show detection and reminder accuracy.

## 3. Out of Scope
* Performance and load testing (Phase 6).
* UI/UX visual regression testing.
* Third-party integration testing (External calendar sync).

## 4. Definitions
* **Negative Authorization Test:** A test case explicitly designed to attempt an unauthorized action and verify that the system throws a `PermissionDenied` exception.
* **Zero-Stub Requirement:** A mandate that production background jobs must be tested against real services, never stubs.
* **Eviction Proof:** Evidence that a user's WebSocket subscription is terminated immediately upon losing authorization to the resource.

## 5. Detailed Sections

### 5.1 Unit Tests
* **Model Tests:** Validate field constraints (e.g., `reschedule_count <= 3`), UUID uniqueness, and required timestamps.
* **Service Tests:** Verify internal logic of `AvailabilityService` (spanning days correctly) and `NoShowService` (calculating the 2-hour window).
* **State Machine Tests:** Exhaustive testing of the `Booking` state machine to ensure invalid transitions are rejected.
* **Permission Tests:** Direct testing of the `RBACChecker` with mock resources.

* **BookingDay Persistency:** The system MUST NOT persist one BookingDay record per reserved day.
Reserved days are derived from Booking temporal boundaries.

### 5.2 Integration Tests
* **Request ↔ Booking Integration:** Prove that accepting a Technician Assignment in the Request domain automatically instantiates an `unscheduled` Booking.
* **Service Integration:** Verify `SchedulingService` correctly invokes `AvailabilityService` before committing a window.
* **WebSocket Integration:** Prove that a message sent to `request_{id}` group arrives at the client when a Booking state changes.

### 5.3 E2E Journey & Conflict Handling Tests
* **The Scheduling Journey:** Customer Creates -> Staff Assigns -> Tech Accepts -> Staff Schedules -> Tech Starts.
* **The Rescheduling Journey:** Prove a window can be moved 3 times but fails on the 4th, regardless of the actor.
* **No-Show Tests:** Add tests for Customer no-show, Technician no-show, 2-hour grace-period enforcement, booking terminal behavior, and request continuity behavior. Prove the system autonomously cancels the Request exactly 2 hours after a missed start time.
* **Emergency Displacement Journey:** Prove emergency requests require manual manager intervention for displacement; verify automatic displacement is blocked.
* **Conflict Handling Tests:** Add explicit tests for double booking, blackout conflicts, extension conflicts, technician reassignment conflicts, and emergency scheduling conflicts.

### 5.4 Security & Authorization Tests
* **RBAC Enforcement:** Prove Staff can schedule but Technicians/Customers cannot.
* **Negative Authorization:** Explicit tests using `pytest.raises(PermissionDenied)` for:
  * Customer B modifying Customer A's Booking.
  * Technician A modifying Technician B's Working Hours.
  * Unauthorized scheduling attempt.
  * Unauthorized rescheduling attempt.
  * Unauthorized duration extension attempt.
  * Unauthorized blackout management.
  * Unauthorized emergency override.
  * Unauthorized calendar view (IDOR).
  * Unauthorized cancellation attempt.
  * Invalid technician actions.
* **IDOR Prevention:** Verify that guessing a Booking UUID without an assigned role results in a `404` or `403`.
* **Technician Access Revocation:** Prove that if a Technician is unassigned from a Request, they can no longer query the subordinate Booking API.

### 5.5 Concurrency & Transactional Tests
* **Double-Booking Attempts (Scheduling Race):** Two threads attempting to schedule the same Technician into overlapping slots; prove one fails. **The first successful committed transaction wins.**
* **Booking Creation Race:** Prove simultaneous assignment acceptance attempts do not result in duplicate booking creation.
* **Blackout Creation Race:** Verify that parallel attempts to create a blackout date and schedule a booking correctly reject the blackout if the booking commits first.
* **Concurrent Rescheduling:** Verify `select_for_update` prevents the `reschedule_count` from being bypassed via race conditions.
* **JIT Revalidation Proof:** Prove that the system rejects an overlapping booking if a conflict was created during the transaction window but after initial availability lookup.
* **Transaction Integrity:** Prove that if a Domain Event dispatch fails, the Booking DB mutation is rolled back (or vice-versa).

### 5.6 Event & Audit Tests
* **Contract Validation:** Prove emitted payloads match `booking-event-contracts.md` exactly.
* **Service → Event → WebSocket Propagation:** A single Service call must be proven to result in a WebSocket broadcast on the `request_{id}` channel.
* **Audit Immutability:** Verify that `AuditLogEntry` records for Bookings cannot be edited via the API.
* **Correlation:** Prove that a Booking creation audit log shares the same `correlation_id` as the Request assignment log.

### 5.7 Background Job Tests
* **Stubs Verification:** Explicitly verify that `monitor_no_show_task` invokes `NoShowService` (No stubs allowed).
* **Idempotency:** Verify that running the No-Show monitor twice in 1 minute does not emit duplicate events.
* **Retry Behavior:** Simulate a DB lock during a reminder job and verify Celery retry logic.

## 6. Matrices & Infrastructure

### 6.1 Test Ownership Matrix
| Layer | Primary Responsibility | Validation Tool |
| :--- | :--- | :--- |
| **Domain Logic** | Backend Architect | Pytest (Unit) |
| **API/Security** | Security Engineer | Pytest (DRF APIClient) |
| **Real-time** | Backend Engineer | Pytest-Channels (Communicator) |
| **Workflows** | QA Lead | E2E Integration Suite |

### 6.2 Required Coverage Matrix
| Component | Targeted Coverage | Mandatory Validation |
| :--- | :--- | :--- |
| **Services** | 100% | State + Audit + Event |
| **RBAC / Checks** | 100% | Negative Authorization |
| **State Machine** | 100% | Guard Conditions |
| **WebSocket** | 95% | Eviction + IDOR |

### 6.3 Infrastructure & CI Gates
* **Fixtures:** `booking_factory`, `working_hours_factory`, `technician_with_bookings`.
* **CI Requirement:** 100% pass rate on all Security and Concurrency tests is a hard block for merging.
* **Release Gate:** Service-layer coverage must exceed 98% for the Booking app.

## 7. Dependencies
* `docs/architecture/booking/booking-services.md`
* `docs/implementation/booking/booking-permission-mapping.md`
* `docs/implementation/booking/booking-event-contracts.md`

## 8. Open Questions
* None at this time.

## 9. Completion Criteria
* Testing suite provides automated proof that Technician reassignment removes access to Booking data.
* Testing suite provides automated proof that Request cancellation terminates the subordinate Booking lifecycle.
* All 13 negative authorization scenarios defined in the permission mapping are implemented and passing.
