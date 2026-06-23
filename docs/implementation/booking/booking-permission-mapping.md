# Booking Permission Mapping Design

## 1. Purpose
The purpose of this document is to translate the architectural permissions defined in Phase 4 into strict, executable implementation rules. It maps domain-level access control into definitive service-layer RBAC (Role-Based Access Control) requirements, explicit ownership rules, and IDOR (Insecure Direct Object Reference) prevention protocols.

## 2. Scope
This document covers:
* Translation of the architectural Role Matrix (Customer, Technician, Staff, Manager, Superadmin).
* Explicit mappings for Booking, Scheduling, Availability, Rescheduling, No-show, Calendar, and Blackout permissions.
* Transition ownership and Action ownership matrices.
* Negative authorization and IDOR prevention design requirements.
* Service-layer RBAC boundary enforcement.

## 3. Out of Scope
* Generation of Django `permissions.py` or actual Python implementation code.
* Invention of new business rules, roles, or lifecycle states not present in the approved Phase 4 architecture.
* API design (covered in `booking-api-design.md`).

## 4. Definitions
* **IDOR Prevention:** Logic verifying that an authenticated actor possesses a valid, authorized relationship to the specific resource (e.g., Booking or Working Hours) they are attempting to interact with, not just a valid platform role.
* **Service-Layer RBAC:** Access control evaluated inside the Domain Service (e.g., `SchedulingService`), preventing direct manipulation regardless of whether the entry point is an API, background task, or CLI.

## 5. Detailed Sections

### 5.1 Role Matrix & Action Ownership

| Action/Entity | Customer | Technician | Staff | Manager / Superadmin | System |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Booking Creation** | DENY | DENY | DENY | DENY | **ALLOW** |
| **View Own Schedule** | **ALLOW** | **ALLOW** | **ALLOW** | **ALLOW** | **ALLOW** |
| **View Org Schedule** | DENY | DENY | **ALLOW** | **ALLOW** | **ALLOW** |
| **Schedule Booking** | DENY | DENY | **ALLOW** | **ALLOW** | DENY |
| **Reschedule Booking**| **ALLOW** | **ALLOW** | **ALLOW** | **ALLOW** | DENY |
| **Start Booking** | Denied | **ALLOW** | Denied | Denied | Denied |
| **Extend Duration** | Denied | **ALLOW** | Denied | Denied | Denied |
| **Report No-Show** | Denied | **ALLOW** | **ALLOW** | **ALLOW** | Denied |
| **Manage Working Hrs**| Deny | **ALLOW** | Denied | **ALLOW** (Override) | Denied |
| **Manage Blackouts** | Deny | **ALLOW** | Denied | **ALLOW** | Denied |
| **View Calendar** | **RESTRICTED*** | **OWN ONLY** | **ALLOW ALL** | **ALLOW ALL** | **ALLOW ALL** |

**\*Customer Visibility Rules:** Customers may view the assigned technician identity and their specific booking schedule. They may NOT view technician availability outside their own booking context.

### 5.2 Transition Ownership Matrix

| Transition | Start State | End State | Permitted Roles | Service Layer Owner |
| :--- | :--- | :--- | :--- | :--- |
| Create | `[None]` | `unscheduled` | System (Automated) | `BookingService` |
| Schedule | `unscheduled` | `scheduled` | Staff, Manager | `SchedulingService` |
| Reschedule | `scheduled` | `scheduled` | Customer, Tech, Staff, Mgr | `ReschedulingService` |
| Start Work | `scheduled` | `in_progress` | Technician | `BookingService` |
| No-Show | `scheduled`/`in_progress` | `no_show` | Technician, Staff, Mgr | `NoShowService` |

### 5.3 Detailed Permission Mappings

#### 5.3.1 Booking Creation (`booking.create`)
* **Purpose:** Ensures bookings are only instantiated by automated workflows.
* **Allowed Roles:** System explicitly; DENY all human roles.
* **Scope Rules:** Must execute strictly within the context of a technician accepting an assignment.
* **Ownership Rules:** N/A.
* **Denial Conditions:** If an API payload attempts to force creation.

#### 5.3.2 Scheduling (`booking.schedule`)
* **Purpose:** Secures the initial calendar placement of a booking.
* **Allowed Roles:** Staff, Manager, Superadmin.
* **Scope Rules:** Booking must be in the `unscheduled` state.
* **Ownership Rules:** Staff scheduling requires organization-wide scheduling privileges.
* **Denial Conditions:** If Customer or Technician attempts to schedule. If double-booking conflict exists.

#### 5.3.3 Rescheduling (`booking.reschedule`)
* **Purpose:** Secures altering the temporal window of an existing booking.
* **Allowed Roles:** Customer, Technician, Staff, Manager, Superadmin.
* **Scope Rules:** Booking must be `scheduled`. Total reschedules must be < 3.
* **Ownership Rules:** 
  * Customers may only reschedule bookings tied to their own Requests.
  * Technicians may only reschedule bookings assigned to them.
* **Denial Conditions:** If limit >= 3. If overlap conflict exists. If IDOR ownership mismatch.

#### 5.3.4 No-Show Reporting (`booking.no_show`)
* **Purpose:** Secures the terminal declaration of party absence.
* **Allowed Roles:** Technician, Staff, Manager, Superadmin.
* **Scope Rules:** Must occur >= 2 hours after scheduled start time.
* **Ownership Rules:** Technician can only declare no-show for their assigned bookings.
* **Denial Conditions:** If < 2 hours from start time. If Customer attempts to declare.

#### 5.3.5 Working Hours Management (`calendar.manage_hours`)
* **Purpose:** Secures the definition of base availability capacity.
* **Allowed Roles:** Technician, Manager, Superadmin.
* **Scope Rules:** Cannot be modified if active assignments or bookings exist.
* **Ownership Rules:** Technician can only modify their own calendar.
* **Denial Conditions:** If active operational commitments exist. If Staff attempts to modify.

#### 5.3.6 Blackout Date Management (`calendar.manage_blackouts`)
* **Purpose:** Allows technicians to block off time for personal unavailability.
* **Allowed Roles:** Technician, Manager, Superadmin.
* **Scope Rules:** Cannot overlap with existing scheduled bookings.
* **Ownership Rules:** Technicians manage their own; Managers can manage all.
* **Denial Conditions:** If conflict with existing booking exists.

#### 5.3.7 Start Booking (`booking.start`)
* **Purpose:** Transitions a booking to `in_progress`.
* **Allowed Roles:** Technician.
* **Scope Rules:** Booking must be `scheduled`.
* **Ownership Rules:** Technician must be the one assigned to the parent Request.
* **Denial Conditions:** If not the assigned technician. If start time is outside operational variances.

#### 5.3.8 Extend Duration (`booking.extend`)
* **Purpose:** Allows a technician to increase the estimated duration of an active or scheduled booking.
* **Allowed Roles:** Technician.
* **Scope Rules:** Booking must be `scheduled` or `in_progress`.
* **Ownership Rules:** Technician must be the one assigned to the parent Request.
* **Denial Conditions:** If overlap conflict exists. If not the assigned technician.

#### 5.3.9 View Calendar (`calendar.view`)
* **Purpose:** Secures read access to temporal schedules and availability.
* **Allowed Roles:** Customer (Restricted), Technician (Own), Staff, Manager, Superadmin.
* **Scope Rules:** 
    * Customers: Restricted to their specific booking and assigned technician.
    * Technicians: Restricted to their own calendar.
* **Ownership Rules:** IDOR verification required for Customers and Technicians.
* **Denial Conditions:** Unauthorized access to another technician's schedule.

#### 5.3.10 Cancel Booking (`booking.cancel`)
* **Purpose:** Terminates a booking, usually as a cascade from a Request cancellation.
* **Allowed Roles:** System (Automated), Manager (Approval for refunds).
* **Scope Rules:** Inherits Request cancellation policy rules.
* **Ownership Rules:** N/A for System; Manager for approval overrides.
* **Denial Conditions:** If refund is required but not verified (Blocked).

### 5.4 IDOR Prevention Mapping

| Operation | Actor Role | Service Layer Verification Rule |
| :--- | :--- | :--- |
| Any Mutation | Customer | `actor.id == booking.request.customer_id` |
| Any Mutation | Technician | `actor.id == booking.request.assigned_technician_id` |
| Manage Hours | Technician | `actor.id == working_hours.technician_id` |

### 5.5 Negative Authorization Examples (Test Requirements)
The implementation design mandates the following scenarios must explicitly throw a `PermissionDenied` exception at the Service Layer:
1. Customer attempts to alter a Booking Schedule where they are not the `customer_id` of the parent Request (IDOR).
2. Technician attempts to alter Working Hours while they have an active `scheduled` booking.
3. Staff attempts to create a Booking directly instead of scheduling an `unscheduled` one.
4. Customer attempts to trigger `NoShowService` for any Booking.

### 5.6 Service-Layer RBAC Requirements
All permission enforcement must reside within the Domain Services (`BookingService`, `SchedulingService`, etc.). API controllers must not contain standalone ownership checks. The service methods must accept the `Actor` as an argument and perform internal verification using the centralized RBAC checker before proceeding with transaction blocks.

## 6. Dependencies
* `docs/architecture/booking/booking-permissions.md`
* `docs/architecture/booking/booking-data-ownership.md`
* `docs/implementation/booking/booking-service-design.md`

## 7. Open Questions
* None at this time.

## 8. Completion Criteria
* Implementation of the RBAC layer perfectly mirrors this matrix within the service boundaries.
* Explicit negative tests exist for all defined denial conditions and IDOR mappings.
