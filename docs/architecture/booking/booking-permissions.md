# Booking Permissions & RBAC

## 1. Purpose
The purpose of this document is to define the Role-Based Access Control (RBAC) matrix for the Booking domain. It strictly enforces the authoritative boundaries regarding which actors can create, schedule, modify, and terminate bookings.

## 2. Scope
This document covers:
* Allowed operational capabilities for Customers, Technicians, Staff, Managers, and the System.
* Enforced denial of permissions (e.g., preventing Customer scheduling).

## 3. Out of Scope
* Implementation of permission decorators or middleware.
* Request domain permissions (handled in Phase 3).
* User authentication protocols.

## 4. Definitions
* **Actor:** An authenticated entity attempting to perform an action on a Booking.
* **Scheduling Authority:** The explicit right to transition a Booking from `unscheduled` to `scheduled`.

## 5. Detailed Sections

### 5.1 Core Permission Rules
* **System Automation:** Only the System can create a Booking. No human actor possesses the `booking.create` permission.
* **Scheduling Monopoly:** Only Staff (and Managers by extension) possess the authority to schedule a Booking.
* **Rescheduling Distribution:** Rescheduling is a shared capability, strictly bound by the maximum limit of 3 reschedules.

### 5.2 Booking RBAC Matrix

| Action | Permission Key | Customer | Technician | Staff | Manager | System |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Create Booking** | `booking.create` | DENY | DENY | DENY | DENY | **ALLOW** |
| **Schedule Booking**| `booking.schedule` | DENY | DENY | **ALLOW**| **ALLOW**| DENY |
| **Reschedule Booking**| `booking.reschedule`| **ALLOW**| **ALLOW**| **ALLOW**| **ALLOW**| DENY |
| **Start Booking** | `booking.start` | DENY | **ALLOW**| DENY | DENY | DENY |
| **Extend Duration** | `booking.extend` | DENY | **ALLOW**| DENY | DENY | DENY |
| **Report No-Show** | `booking.no_show` | DENY | **ALLOW**| **ALLOW**| **ALLOW**| DENY |
| **Manage Working Hours**| `calendar.manage_hours`| DENY | **ALLOW**| DENY | **ALLOW**| DENY |
| **Manage Blackouts** | `calendar.manage_blackouts`| DENY | **ALLOW**| DENY | **ALLOW**| DENY |
| **View Calendar** | `calendar.view` | **RESTRICTED*** | **OWN ONLY** | **ALLOW ALL** | **ALLOW ALL** | **ALLOW ALL** |
| **Cancel Booking** | `booking.cancel` | *Inherits Request Rule* | *Inherits Request Rule* | *Inherits Request Rule* | *Inherits Request Rule* | **ALLOW** (No-Show cascade) |

**\*Customer Calendar Visibility:** Customers may view the assigned technician's identity and their specific booking schedule. They may NOT view technician availability outside their own booking context.

### 5.3 Ownership Scope & IDOR Rules
Each permission is bound by ownership constraints to prevent Insecure Direct Object Reference (IDOR) violations:

*   **`booking.reschedule`:**
    *   **Customer:** Limited to bookings tied to their own Requests.
    *   **Technician:** Limited to bookings assigned to them.
*   **`booking.no_show`:**
    *   **Technician:** Can only declare no-show for their assigned bookings.
*   **`booking.start`:**
    *   **Technician:** Must be the assigned technician for the parent Request.
*   **`booking.extend`:**
    *   **Technician:** Must be the assigned technician for the parent Request.
*   **`calendar.manage_hours`:**
    *   **Technician:** Restricted to their own schedule.
*   **`calendar.manage_blackouts`:**
    *   **Technician:** Restricted to their own schedule.
*   **`calendar.view`:**
    *   **Technician:** Restricted to their own schedule.
    *   **Customer:** Restricted to the specific booking context.

### 5.4 Transition Ownership Matrix
The following transitions define state change authority and the service layer responsible for enforcement:

| Transition | Start State | End State | Permission Key | Permitted Roles | Service Layer Owner |
| :--- | :--- | :--- | :--- | :--- | :--- |
| Create | `[None]` | `unscheduled` | `booking.create` | System (Automated) | `BookingService` |
| Schedule | `unscheduled` | `scheduled` | `booking.schedule` | Staff, Manager | `SchedulingService` |
| Reschedule | `scheduled` | `scheduled` | `booking.reschedule` | Customer, Tech, Staff, Mgr | `ReschedulingService` |
| Start Work | `scheduled` | `in_progress` | `booking.start` | Technician | `BookingService` |
| Extend Duration| `scheduled`/`in_progress` | `scheduled`/`in_progress` | `booking.extend` | Technician | `BookingService` |
| No-Show | `scheduled`/`in_progress` | `no_show` | `booking.no_show` | Technician, Staff, Mgr | `NoShowService` |
| Completion | `in_progress` | `completed` | N/A (System Sync) | System | `BookingService` |
| Cancellation | `Any Active` | `cancelled` | `booking.cancel` | System / Mgr Approval | `BookingService` |

### 5.5 Cancellation Approval (Refund Dependency)
* In scenarios requiring a refund, the **Manager** role is the sole authority capable of approving the final cancellation. This permission is procedurally blocked until the refund step is successfully verified.

## 6. Dependencies
* `docs/workflows/scheduling-flow.md`
* `docs/workflows/rescheduling-flow.md`
* `docs/workflows/booking-cancellation-policy.md`

## 7. Implementation References
* `docs/implementation/booking/booking-permission-mapping.md`

## 8. Open Questions
* None at this time.

## 8. Completion Criteria
* Security layer enforces the matrix perfectly, throwing access denied errors if a Technician or Customer attempts to initially schedule a booking.
* The system is the only authenticated actor capable of triggering the booking instantiation logic.
