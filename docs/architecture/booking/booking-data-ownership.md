# Booking Data Ownership Architecture

## 1. Purpose
The purpose of this document is to define the strict ownership and authority boundaries for all data entities within the Booking domain. It establishes the rules regarding which actors possess the rights to create, edit, approve, and exert final authority over booking-related records.

## 2. Scope
This document covers ownership definitions for the following data objects:
* Booking
* Booking Schedule
* Availability Records
* Working Hours
* No Show Records
* Reschedule Records
* Calendar Records

## 3. Out of Scope
* Database schema structures and foreign key definitions.
* API payload configurations.
* Request domain data ownership (handled in Phase 3).
* Code implementation of role-based access control (RBAC).

## 4. Definitions
* **Creator:** The actor or entity that instantiates the data object.
* **Editor:** The actor or entity permitted to mutate the data object after creation.
* **Approver:** The actor or entity required to validate a mutation or creation event before it becomes authoritative.
* **Final Authority:** The actor or entity with the ultimate power to override, govern, or terminate the data object.

## 5. Detailed Sections

### 5.1 Ownership Boundaries
* **Customer Boundaries:** Customers have extremely limited authority. They cannot schedule bookings but are permitted to edit a Booking Schedule via the rescheduling workflow (subject to the 3-reschedule limit). They have no authority over working hours or calendar derivation.
* **Technician Boundaries:** Technicians own their Working Hours (subject to active assignment blocks). They cannot schedule bookings initially, but may reschedule them. They can create No-Show records.
* **Staff Boundaries:** Staff holds the exclusive authority to create a Booking Schedule (initial scheduling). They can also reschedule bookings and create No-Show records.
* **Manager Boundaries:** Managers hold Final Authority over all operational data. They can override schedules, reschedule bookings, and are the required approver for cancellations linked to refunds.
* **System Boundaries:** The System holds exclusive creation rights for the core Booking entity, Availability Records, and Calendar Records. The System enforces invariants (like double-booking prevention) autonomously.

### 5.2 Data Ownership Matrix

| Data Object | Creator | Editor | Approver | Final Authority |
| :--- | :--- | :--- | :--- | :--- |
| **Booking** | System | System | N/A (Automated) | Manager |
| **Booking Schedule** | Staff | Customer, Technician, Staff, Manager | System (Automated Validation) | Manager |
| **Availability Records** | System | System | System | System |
| **Working Hours** | Technician | Technician | N/A (Blocked if active) | Manager |
| **No-Show Records** | Technician, Staff | N/A (Immutable) | N/A | Manager |
| **Reschedule Records** | Customer, Technician, Staff, Manager | System (Audit Only) | System (Automated Validation) | Manager |
| **Calendar Records** | System | System | System | System |

## 6. Dependencies
* `docs/architecture/booking/booking-domain.md`
* `docs/workflows/calendar-policy.md`
* `docs/workflows/scheduling-flow.md`
* `docs/workflows/rescheduling-flow.md`

## 7. Implementation References
* `docs/implementation/booking/booking-permission-mapping.md`

## 8. Open Questions
* None at this time.

## 8. Completion Criteria
* Implementation of the RBAC layer perfectly mirrors the Data Ownership Matrix.
* System components successfully prevent unauthorized creation or modification of restricted objects (e.g., Staff attempting to directly edit Technician Working Hours).
