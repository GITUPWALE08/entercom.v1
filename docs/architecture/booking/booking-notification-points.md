# Booking Notification Points Architecture

## 1. Purpose
The purpose of this document is to catalog and define all notification trigger points related to the Booking lifecycle. It establishes the architectural expectations for when the system must communicate scheduling events, ensuring all relevant actors are informed of critical state mutations.

## 2. Scope
This document covers:
* Booking creation notifications.
* Scheduling notifications.
* Rescheduling notifications.
* Cancellation notifications.
* No-show notifications.
* Assignment-related booking notifications.
* Reminder notifications.

## 3. Out of Scope
* Notification templates (e.g., email copy, SMS text).
* WebSocket payload structures.
* Notification delivery implementation (e.g., integration with Twilio or SendGrid).
* Database models for storing notification history.

## 4. Definitions
* **Trigger:** The specific domain event or system condition that initiates the notification workflow.
* **Recipient:** The intended actor(s) (Customer, Technician, Staff, Manager) who must receive the notification.
* **Priority:** The relative urgency of the notification (e.g., High, Normal), influencing delivery latency expectations.
* **Channel Eligibility:** The permitted delivery methods (e.g., Email, SMS, In-App Push) for the specific notification.
* **Dependency:** The prerequisite workflow or state condition that must be satisfied before the trigger is valid.

## 5. Detailed Sections

### 5.1 Notification Matrix

| Notification Type | Trigger | Recipient | Priority | Channel Eligibility | Dependency |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Assignment-Related / Booking Creation** | Technician explicitly accepts the Request assignment, triggering automatic Booking creation (`status=unscheduled`). | Staff, Customer | Normal | In-App, Email | Assignment Policy; Technician acceptance logic. |
| **Scheduling** | Staff explicitly assigns a temporal window (days) to the unscheduled Booking. | Customer, Technician | High | In-App, Email, SMS | Scheduling Flow; System multi-day spanning logic. |
| **Rescheduling** | Authorized actor (Customer, Technician, Staff, Manager) alters the existing booking window (reschedule count <= 3). | Customer, Technician, Staff | High | In-App, Email, SMS | Rescheduling Flow; Overlap prevention and working hour bounds. |
| **Cancellation** | The Request (and subordinately, the Booking) transitions to `cancelled` (post-refund approval, if applicable). | Customer, Technician | High | In-App, Email, SMS | Cancellation Policy; Refund Dependency rules. |
| **No-Show** | Technician or Staff formally records a no-show after the mandatory 2-hour grace period expires. | Customer, Manager | High | In-App, Email | No-Show Policy; 2-Hour Grace Period. |
| **Reminder** | Temporal proximity to the scheduled booking start time. | Customer, Technician | Normal | In-App, SMS | Scheduled temporal window. |

## 6. Dependencies
* `docs/architecture/booking/booking-domain.md`
* `docs/workflows/booking-lifecycle.md`
* `docs/workflows/scheduling-flow.md`
* `docs/workflows/no-show-policy.md`

## 7. Implementation References
* `docs/implementation/booking/booking-background-jobs.md`
* `docs/implementation/booking/booking-event-contracts.md`

## 8. Open Questions
* None at this time.

## 8. Completion Criteria
* The notification orchestrator correctly listens to the defined triggers without embedding delivery logic in the core domain services.
* The system strictly suppresses cancellation notifications until any required refund is fully approved by a Manager.
4 hours before start, 1 hour before start)?

## 8. Completion Criteria
* The notification orchestrator correctly listens to the defined triggers without embedding delivery logic in the core domain services.
* The system strictly suppresses cancellation notifications until any required refund is fully approved by a Manager.
