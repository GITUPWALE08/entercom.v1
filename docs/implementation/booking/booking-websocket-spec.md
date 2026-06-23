# Booking WebSocket Specification

## 1. Purpose
The purpose of this document is to define the realtime communication requirements for the Booking domain. It specifies how domain events are translated into WebSocket messages and delivered to authorized actors while maintaining strict alignment with the Request-subordinate architecture.

## 2. Scope
This document covers:
* The mapping of Domain Events to Realtime Event broadcasts.
* Authorization and IDOR prevention rules for realtime delivery.
* Subscription management for Customers, Technicians, Staff, and Managers.
* Revocation logic during technician reassignment.

## 3. Out of Scope
* Technical implementation of the WebSocket server (e.g., Django Channels configuration).
* Client-side WebSocket connection logic or UI state management.
* Notification templates (covered in Notification Point design).

## 4. Definitions
* **Realtime Event:** A message broadcast over an active WebSocket connection to inform a client of a state change.
* **Subordinate Broadcast:** The delivery of subordinate domain events (Booking) over the communication channel of the parent aggregate (Request).

## 5. Detailed Sections

### 5.1 Channel Topology & Authorization

**Approved Decision**
Booking realtime events SHALL be broadcast through the parent `request_{id}` WebSocket channel. Independent `booking_{id}` channels are explicitly out of scope for MVP.

**Rationale:**
* **Subordinate Integrity:** Booking is strictly subordinate to Request. 
* **Authorization Boundary:** Request remains the canonical authorization boundary. 
* **Leak Prevention:** This topology guarantees that technician reassignment (managed at the Request level) immediately revokes access to all subordinate booking updates without requiring duplicate authorization or eviction infrastructure.

### 5.2 Realtime Event Inventory

| Event Source | Triggering Domain Event | Authorized Recipients | Delivery Expectation |
| :--- | :--- | :--- | :--- |
| `BookingService` | `booking.created` | Staff, Customer | Immediate |
| `SchedulingService` | `booking.scheduled` | Staff, Customer, Technician | Immediate |
| `ReschedulingService`| `booking.rescheduled` | Staff, Customer, Technician | Immediate |
| `BookingService` | `booking.in_progress` | Staff, Customer | Immediate |
| `BookingService` | `booking.duration_extended` | Staff, Customer, Technician | Immediate |
| `NoShowService` | `booking.no_show` | Staff, Manager, Technician | High Priority |
| `BookingService` | `booking.cancelled` | Staff, Customer, Technician | Immediate |
| `BookingService` | `booking.completed` | Staff, Customer, Technician | Immediate |

### 5.3 Authorization Enforcement & Revocation
* **Ownership Validation:** Realtime events for a specific booking must only be delivered to the User ID matching the `customer_id` on the parent Request.
* **Assignment Validation:** Technicians only receive events for bookings where they are the `assigned_technician_id` on the parent Request.
* **Reassignment Revocation:** If a Request is unassigned or reassigned in the Request domain, the WebSocket consumer must immediately evict the previous technician from the broadcast group.
* **Negative Authorization:** Any attempt to subscribe to a booking-related broadcast without a valid Role or Ownership relationship must result in a `permission_denied` control message.

## 6. Dependencies
* `docs/architecture/booking/booking-domain.md`
* `docs/implementation/booking/booking-event-contracts.md`
* `docs/implementation/request/request-websocket-spec.md`

## 7. Open Questions
* None at this time.

## 8. Completion Criteria
* Realtime event delivery is strictly bound to the authorization state of the parent Request.
* The system demonstrates zero event leakage to technicians after they are unassigned from a Request.
