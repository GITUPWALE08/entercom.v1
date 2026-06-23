# Booking Event Contracts

## 1. Purpose
The purpose of this document is to define the implementation-level contracts for all events emitted by the Booking domain. It establishes the required data structures, payload schemas, and correlation requirements necessary for reliable asynchronous communication between the Booking domain and the wider platform.

## 2. Scope
This document covers:
* The catalog of Booking-specific lifecycle, scheduling, rescheduling, and terminal events.
* Payload field requirements and data types.
* Event correlation rules binding Bookings to Requests.
* Reliability expectations (ordering, idempotency, retries).

## 3. Out of Scope
* Actual Python/Django event publisher code.
* Message broker configuration (e.g., RabbitMQ, Redis).
* WebSocket push notification payloads (covered in notification architecture).
* Redefining Request domain lifecycle events.

## 4. Definitions
* **Producer:** The specific Domain Service responsible for emitting the event.
* **Consumer:** The internal or external systems (e.g., Notification Service, Audit Log) that react to the event.
* **Correlation ID:** A persistent UUID that tracks the original Request-driven transaction across domain boundaries.
* **Idempotency Key:** A unique identifier (often the event ID or a combination of Request ID and state) used by consumers to prevent duplicate processing.
* **UTC Standard:** All temporal fields must be serialized as ISO-8601 strings in the UTC timezone.

## 5. Detailed Sections

### 5.1 Domain Distinction Matrix

| Event Namespace | Authority | Description |
| :--- | :--- | :--- |
| `request.*` | Request Domain | Governs "What" and "Who". E.g., `request.assigned`. |
| `booking.*` | Booking Domain | Governs "When". E.g., `booking.scheduled`. |

### 5.2 Event Catalog & Payload Contracts

#### 5.2.1 `booking.created`
* **Producer:** `BookingService`
* **Trigger:** Reaction to `assignment.accepted` (Request Event).
* **Required Payload:**
  * `booking_id` (UUID)
  * `request_id` (UUID/Int)
  * `status` (String: `unscheduled`)
  * `correlation_id` (UUID)
* **Audit Relationship:** Matches the `booking.created` audit action.

#### 5.2.2 `booking.scheduled`
* **Producer:** `SchedulingService`
* **Trigger:** Staff assigns a temporal window.
* **Required Payload:**
  * `booking_id` (UUID)
  * `request_id` (UUID/Int)
  * `technician_id` (UUID/Int)
  * `start_time` (ISO-8601)
  * `end_time` (ISO-8601)
  * `duration_days` (Int)
  * `correlation_id` (UUID)
  * `actor_id` (UUID/Int)
* **Audit Relationship:** Matches `booking.scheduled` audit action.

#### 5.2.3 `booking.rescheduled`
* **Producer:** `ReschedulingService`
* **Trigger:** Authorized actor alters the window.
* **Required Payload:**
  * `booking_id` (UUID)
  * `request_id` (UUID/Int)
  * `new_start_time` (ISO-8601)
  * `new_end_time` (ISO-8601)
  * `previous_start_time` (ISO-8601)
  * `reschedule_count` (Int: <= 3)
  * `actor_id` (UUID/Int)
  * `correlation_id` (UUID)
* **Audit Relationship:** Matches `booking.rescheduled` audit action.

#### 5.2.4 `booking.duration_extended`
* **Producer:** `BookingService`
* **Trigger:** Technician updates duration estimate.
* **Required Payload:**
  * `booking_id` (UUID)
  * `request_id` (UUID/Int)
  * `previous_duration_days` (Int)
  * `new_duration_days` (Int)
  * `correlation_id` (UUID)
  * `actor_id` (UUID/Int)
* **Audit Relationship:** Matches `booking.duration_extended` audit action.

#### 5.2.5 `booking.in_progress`
* **Producer:** `BookingService`
* **Trigger:** Technician starts the engagement.
* **Required Payload:**
  * `booking_id` (UUID)
  * `request_id` (UUID/Int)
  * `started_at` (ISO-8601)
  * `correlation_id` (UUID)
  * `actor_id` (UUID/Int)
* **Audit Relationship:** Matches `booking.in_progress` audit action.

#### 5.2.6 `booking.completed`
* **Producer:** `BookingService`
* **Trigger:** Parent Request transitions to completed state.
* **Required Payload:**
  * `booking_id` (UUID)
  * `request_id` (UUID)
  * `correlation_id` (UUID)
  * `actor_id` (UUID/Int)
* **Audit Relationship:** Matches `booking.completed` audit action.

#### 5.2.6 `booking.cancelled`
* **Producer:** `BookingService`
* **Trigger:** Parent Request transitions to cancelled state.
* **Required Payload:**
  * `booking_id` (UUID)
  * `request_id` (UUID)
  * `correlation_id` (UUID)
  * `actor_id` (UUID/Int)
* **Audit Relationship:** Matches `booking.cancelled` audit action.

#### 5.2.7 `booking.no_show`
* **Producer:** `NoShowService`
* **Trigger:** Absence recorded after 2-hour grace period.
* **Required Payload:**
  * `booking_id` (UUID)
  * `request_id` (UUID)
  * `absent_party` (String: `customer`|`technician`)
  * `declared_at` (ISO-8601)
  * `correlation_id` (UUID)
  * `actor_id` (UUID/Int)
* **Audit Relationship:** Matches `booking.no_show` audit action.

#### 5.2.8 `booking.reminder_sent`
* **Producer:** `BookingReminderJob`
* **Trigger:** 24h or 3h before start time.
* **Required Payload:**
  * `booking_id` (UUID)
  * `request_id` (UUID)
  * `reminder_type` (String: `24h`|`3h`)
  * `recipient_role` (String)
  * `correlation_id` (UUID)
  * `actor_id` (SYSTEM)

#### 5.2.9 `availability.working_hours_updated`
* **Producer:** `AvailabilityService` (or Profile Service listener)
* **Trigger:** Technician modifies base working hours.
* **Required Payload:**
  * `technician_id` (UUID/Int)
  * `schedule_blob` (JSON/Dict)
  * `correlation_id` (UUID)

#### 5.2.10 `availability.blackout_created`
* **Producer:** `AvailabilityService`
* **Trigger:** Blackout date is created.
* **Required Payload:**
  * `event_id` (UUID)
  * `event_name` (String: `availability.blackout_created`)
  * `event_version` (String)
  * `occurred_at` (ISO-8601)
  * `correlation_id` (UUID)
  * `actor_id` (UUID/Int)
  * `technician_id` (UUID/Int)
  * `blackout_id` (UUID/Int)

#### 5.2.11 `availability.blackout_deleted`
* **Producer:** `AvailabilityService`
* **Trigger:** Blackout date is deleted.
* **Required Payload:**
  * `event_id` (UUID)
  * `event_name` (String: `availability.blackout_deleted`)
  * `event_version` (String)
  * `occurred_at` (ISO-8601)
  * `correlation_id` (UUID)
  * `actor_id` (UUID/Int)
  * `technician_id` (UUID/Int)
  * `blackout_id` (UUID/Int)

### 5.3 Reliability & Processing Rules
* **Event Ordering:** Events must be consumed in chronological order per `booking_id`. Consumers must reject `booking.scheduled` if received before `booking.created`.
* **Idempotency:** Consumers must use `(booking_id, event_name, correlation_id)` as a composite idempotency key to prevent double-processing.
* **Contract Validation:** All producers must validate payloads against these contracts before dispatch (e.g., using Pydantic or Django JSON schemas).
* **Versioning:** All Booking events start at `v1`. Version increments are required for any breaking field changes (removals or renames).
* **WebSocket Consistency:** Booking events are dispatched through `request_{id}` channels. No `booking_{id}` websocket channels may exist. Booking event examples (`booking.scheduled`, `booking.rescheduled`, `booking.completed`) must route through the parent Request channel.

### 5.4 Event Ownership Matrix

| Event | Primary Producer | Secondary Consumer |
| :--- | :--- | :--- |
| `booking.created` | `BookingService` | Audit Service, Notification Service |
| `booking.scheduled` | `SchedulingService` | Notification Service, Calendar Sync |
| `booking.rescheduled`| `ReschedulingService` | Notification Service |
| `booking.no_show` | `NoShowService` | Request Domain (Cancellation Trigger) |

## 6. Dependencies
* `docs/architecture/booking/booking-events.md`
* `docs/implementation/booking/booking-service-design.md`
* `docs/architecture/request/request-events.md`

## 7. Open Questions
* UNRESOLVED — BUSINESS DECISION REQUIRED: Do we require an `availability.slot_invalidated` internal event for real-time UI updates when a booking is mid-schedule, or is the `booking.scheduled` broadcast sufficient?

## 8. Completion Criteria
* Payload contracts are exhaustively defined for all 7 lifecycle events.
* Correlation requirements for Request domain linkage are explicitly mapped.
* Event ordering and idempotency guards are defined for consumer implementation.
