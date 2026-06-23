# Booking API Design

## 1. Purpose
The purpose of this document is to translate the approved booking workflows into strict RESTful API contracts. It defines the external interfaces for the Booking domain, ensuring that API exposure perfectly mirrors the underlying Service Layer capabilities and RBAC restrictions, without exposing internal system-only triggers (such as automated creation).

## 2. Scope
This document covers the API endpoints for:
* Booking Details and Lists (Read APIs)
* Availability and Calendar queries
* Scheduling and Rescheduling mutations
* No-show reporting
* Working Hours management

## 3. Out of Scope
* Actual Python/Django ViewSet or Serializer code generation.
* OpenAPI/Swagger schema files.
* Request domain APIs (e.g., assignment endpoints).
* Exact JSON key-value mapping (general shape only).

## 4. Definitions
* **System-Only Action:** An operation (like Booking Creation) that has no exposed HTTP endpoint and is triggered entirely by internal domain events or background tasks.
* **Concurrency Requirement:** API-level expectation that a request might fail with a 409 Conflict if another transaction locks the resource.

## 5. Detailed Sections

### 5.1 System-Only Actions (No API Exposed)
* **Booking Creation:** Booking creation occurs only through: Assignment Accepted -> `BookingService.create_unscheduled_booking()`. Booking creation is therefore system-driven. No endpoint may create an independent booking. Booking APIs operate on a Booking. **There is NO `POST /api/v1/bookings/` endpoint.**
* **Booking Cancellation:** Cascades automatically from Request cancellation workflows. No direct `POST /api/v1/bookings/{id}/cancel` endpoint exists.

### 5.2 Read APIs

#### 5.2.1 List Bookings
* **Endpoint:** `/api/v1/bookings/`
* **HTTP Method:** `GET`
* **Purpose:** Retrieve a list of bookings based on role visibility.
* **Required Permissions:** Authenticated User.
* **Request Parameters:** 
  * `status` (String)
  * `technician_id` (UUID)
  * `start_date` and `end_date` (YYYY-MM-DD): Filters bookings where `start_time` or `end_time` falls within the EXCLUSIVE boundaries of the dates (interpreted as UTC). Maximum span is 365 days.
* **Response Shape:** Paginated list of Booking objects (id, request_id, status, start_time, end_time, duration_days, technician_id).
* **Error Conditions:** 
  * `401 Unauthorized`
  * `400 Bad Request` (Invalid date format, `start_date` >= `end_date`, or range > 365 days).
* **IDOR Protection:**
  * Customers only see bookings where `request.customer_id == user.id`. **Customers may view the assigned technician's identity and booking schedule, but NOT technician availability outside their context.**
  * Technicians only see bookings where `request.assigned_technician_id == user.id`.
  * Staff/Managers see all bookings.
* **Audit Requirements:** None.

#### 5.2.2 Booking Detail
* **Endpoint:** `/api/v1/bookings/{booking_id}/`
* **HTTP Method:** `GET`
* **Purpose:** Retrieve details of a specific booking.
* **Required Permissions:** `booking.view`
* **Request Parameters:** Path parameter: `booking_id` (UUID).
* **Response Shape:** Detailed Booking object including reschedule count and history.
* **Error Conditions:** `404 Not Found` (used to mask `403` for IDOR).
* **IDOR Protection:** Strict ownership verification via Service Layer.

### 5.3 Availability & Calendar APIs

#### 5.3.1 Get Technician Availability
* **Endpoint:** `/api/v1/technicians/{technician_id}/availability/`
* **HTTP Method:** `GET`
* **Purpose:** Retrieve calculated availability slots for scheduling.
* **Required Permissions:** Staff, Manager. (System uses internally).
* **Request Parameters:** `start_date`, `end_date`, `required_duration_days`.
* **Response Shape:** List of available temporal windows (normalized to UTC).
* **Error Conditions:** `400 Bad Request` (invalid dates).

#### 5.3.2 Manage Working Hours
* **Endpoint:** `/api/v1/technicians/{technician_id}/working-hours/`
* **HTTP Method:** `PUT` / `PATCH`
* **Purpose:** Technician updates their baseline capacity.
* **Required Permissions:** Technician (Self), Manager.
* **Request Parameters:** Schedule definition (days, start/end times).
* **Response Shape:** Updated Working Hours object.
* **Error Conditions:** `409 Conflict` (active assignments/bookings exist).
* **IDOR Protection:** Technician must match `technician_id`.

#### 5.3.3 Manage Blackout Dates
* **Endpoint:** `/api/v1/technicians/{technician_id}/blackout-dates/`
* **HTTP Method:** `POST` / `DELETE`
* **Purpose:** Technician defines a period of unavailability.
* **Required Permissions:** Technician (Self), Manager.
* **Request Parameters:** `start_date`, `end_date` (UTC-normalized).
* **Response Shape:** Blackout Date object.
* **Error Conditions:** `409 Conflict` (conflicts with existing booking or assigned request).
* **IDOR Protection:** Technician must match `technician_id`.

### 5.4 Scheduling & Mutation APIs

#### 5.4.1 Schedule Booking
* **Endpoint:** `/api/v1/bookings/{booking_id}/schedule/`
* **HTTP Method:** `POST`
* **Purpose:** Transition an `unscheduled` booking to `scheduled`.
* **Required Permissions:** Staff, Manager (`booking.schedule`).
* **Request Parameters:** `start_date` (UTC-normalized). (Duration is derived from the estimate).
* **Response Shape:** Updated Booking object.
* **Error Conditions:** 
  * `400 Bad Request` (Invalid state, not unscheduled).
  * `409 Conflict` (Double-booking overlap detected by Availability validation).
* **Audit Requirements:** Log scheduling action, actor, and temporal window.

#### 5.4.2 Reschedule Booking
* **Endpoint:** `/api/v1/bookings/{booking_id}/reschedule/`
* **HTTP Method:** `POST`
* **Purpose:** Alter the window of an existing `scheduled` booking.
* **Required Permissions:** Customer, Technician, Staff, Manager (`booking.reschedule`).
* **Request Parameters:** `new_start_date` (UTC-normalized).
* **Response Shape:** Updated Booking object with incremented `reschedule_count`.
* **Error Conditions:**
  * `400 Bad Request` (Limit of 3 reached, or invalid state).
  * `403 Forbidden` (IDOR violation).
  * `409 Conflict` (Overlap detected).
* **IDOR Protection:** Customer/Tech must own/be assigned to the parent Request.
* **Concurrency Requirements:** Must gracefully handle simultaneous reschedule requests via row-level locking.
* **Audit Requirements:** Log previous window, new window, and actor.

#### 5.4.3 Extend Booking Duration
* **Endpoint:** `/api/v1/bookings/{booking_id}/extend/`
* **HTTP Method:** `POST`
* **Purpose:** Technician extends the duration of an existing booking.
* **Required Permissions:** Technician (`booking.extend`).
* **Request Parameters:** `new_duration_days`.
* **Response Shape:** Updated Booking object.
* **Error Conditions:** 
  * `400 Bad Request` (Invalid state).
  * `403 Forbidden` (IDOR violation).
  * `409 Conflict` (Overlap detected).
* **IDOR Protection:** Technician must be assigned to the parent Request.
* **Audit Requirements:** Log duration extension action.

#### 5.4.4 Report No-Show
* **Endpoint:** `/api/v1/bookings/{booking_id}/no-show/`
* **HTTP Method:** `POST`
* **Purpose:** Declare a terminal no-show.
* **Required Permissions:** Technician, Staff, Manager (`booking.no_show`).
* **Request Parameters:** `absent_party` (Customer/Technician).
* **Response Shape:** Terminal Booking object and Cancelled Request ID.
* **Error Conditions:**
  * `400 Bad Request` (2-hour grace period not met).
  * `403 Forbidden` (Customer attempting to call).
* **Audit Requirements:** Log exact timestamp of declaration to prove grace period adherence.

## 6. Dependencies
* `docs/implementation/booking/booking-service-design.md`
* `docs/implementation/booking/booking-permission-mapping.md`

## 7. Open Questions
* None at this time.

## 8. Completion Criteria
* API controllers act purely as thin wrappers passing sanitized data and the `request.user` to the underlying Services.
* Security tests verify that `POST /api/v1/bookings/` is strictly unavailable.
