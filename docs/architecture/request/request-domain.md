# Request Domain Architecture

## 1. Purpose
This document serves as the single source of truth for the "Request" domain entity within the Entercom ecosystem. It defines the core nature of a request, its classification, priority structures, required attributes, and its relationship to other system domains such as bookings and payments.

## 2. Scope
- Request category and priority definitions.
- SLA mapping and calculation rules.
- Core entity attributes (Required, Conditional, and Optional).
- Ownership principles per lifecycle state.
- Relationship modeling (Parent-Child and Cross-Domain).
- Emergency Queue architectural behavior.
- MVP Boundaries and out-of-scope features.

## 3. Out of Scope
- Detailed state transition logic (defined in `docs/workflows/request-lifecycle.md`).
- Database schema design, Django models, or SQL definitions.
- API endpoint specifications or serializer logic.
- Implementation details for background workers or notification triggers.

## 4. Definitions
"A Request is the canonical business object representing a customer, staff, or system initiated need requiring tracking, ownership, lifecycle transitions, and optional fulfillment."

### 4.1 Request Categories
- **installation**: Physical installation work for solar, CCTV, or smart home systems.
- **inspection**: Site visit required before a quotation or work execution.
- **maintenance**: Repair, servicing, or upkeep of existing systems.
- **support**: Technical problem solving or troubleshooting.
- **information**: General customer inquiries or questions not requiring physical work.
- **booking**: Appointment reservation requests.
- **product_order**: Purchase flow for physical hardware.
- **device_outage**: Critical hardware malfunction or system failure.
- **consultation**: Pre-service discussion or planning.
- **warranty**: Post-installation support covered under warranty agreements.

### 4.2 Priority Levels
- **emergency**: Immediate risk or critical outage.
- **urgent**: High-impact issue requiring rapid response.
- **high**: Priority service for significant requests.
- **normal**: Standard service request.
- **low**: Non-critical or long-term requests.

## 5. Core Attributes

### 5.1 Required Attributes (Global)
These attributes must be present for all requests regardless of category:
- **customer**: The unique identifier of the user originating the request.
- **category**: The classification of the request (see section 4.1).
- **description**: A text field explaining the user's need.
- **status**: The current state of the request in its lifecycle.
- **priority**: The importance level (see section 4.2).
- **created_at**: The system-generated timestamp of submission.

### 5.2 Conditional Attributes
- **location/address**: Mandatory for categories requiring physical attendance: `inspection`, `installation`, and `maintenance`.

### 5.3 Optional Attributes
- UNRESOLVED — BUSINESS DECISION REQUIRED (e.g., preferred contact methods, external reference numbers).

### 5.4 Identifier Requirements
Every request MUST be uniquely identifiable through the following system attributes:
- **internal id**: Permanent system-level unique identifier (e.g., UUID).
- **public reference id**: Human-readable reference for customer communication.
- **created timestamp**: Precise record of initial record creation.
- **audit correlation id**: Linked identifier for tracing the request across the Audit Service.

*Note: Technical implementation details of identifiers are out of scope for this architecture document.*

## 6. Required Matrices

### 6.1 Priority and SLA Matrix
| Priority | SLA Target (Initial Response) | Queue Behavior |
| :--- | :--- | :--- |
| **Emergency** | < 24 hours | Routed to Emergency Queue |
| **Urgent** | < 3 working days | Normal Queue |
| **Normal** | < 5 working days | Normal Queue |
| **Low** | < 7 working days | Normal Queue |

**SLA Rules:**
- SLA clock starts exactly at **request submission time**.
- Reassignment of a request to a different technician **does NOT reset** the SLA.

### 6.2 Ownership Matrix
**Ownership Definition**: Ownership is defined as the current responsible actor for:
- SLA accountability
- Required action
- Notifications
- Lifecycle transitions
- Escalation responsibility

| Lifecycle State | Primary Owner |
| :--- | :--- |
| `draft` | Customer |
| `submitted` | Staff Queue (General Staff Ownership) |
| `assigned` | Assigned Technician |
| `pending_verification` | Staff / Manager |
| `escalated` | Manager |
| `completed` | Archive / System |

**Queue Ownership Matrix**:
| Queue | Responsible Role |
| :--- | :--- |
| `staff_queue` | Staff |
| `emergency_queue` | Staff |
| `verification_queue` | Staff / Manager |
| `escalation_queue` | Manager |

### 6.3 Cross-Domain Relationship Matrix (MVP Rules)
| Category | Booking Required | Mandatory Payment | Mandatory Verification |
| :--- | :--- | :--- | :--- |
| `installation` | Mandatory (1:1) | No | Mandatory |
| `inspection` | Mandatory (1:1) | No | Optional |
| `maintenance` | Mandatory (1:1) | No | Mandatory |
| `support` | Optional | No | No |
| `information` | No | No | No |
| `booking` | Yes (1:1) | No | UNRESOLVED — BUSINESS DECISION REQUIRED |
| `product_order` | No | Yes | UNRESOLVED — BUSINESS DECISION REQUIRED |
| `device_outage` | Optional | No | Conditional / UNRESOLVED |
| `consultation` | Yes (1:1) | No | No |
| `warranty` | Conditional | No | Conditional |

## 7. Rules and Relationships

### 7.1 Emergency Queue
- Requests with `emergency` priority (regardless of category) are routed to a dedicated Emergency Queue.
- The Emergency Queue is processed independently to prevent normal workload from starving critical responses.
- **Bypass Rule**: Emergency requests DO NOT jump ahead of normal requests in a shared line; they operate in a parallel processing stream.

### 7.2 Request → Booking Relation
- **MVP Constraint**: Strictly 1 request maps to exactly 1 booking.
- Multiple appointments for a single request are out of scope for MVP.
- Scheduling only happens AFTER technician acceptance.

### 7.3 Parent-Child Relationships
Historical lineage must be preserved to track the service journey:
- **inspection** (Parent) → **installation** (Child)
- **installation** (Parent) → **maintenance** (Child)
- **maintenance** (Parent) → **warranty** (Child)

*Note: Child requests inherit Customer, Location, and Evidence, but NOT Priority.*

## 8. MVP Boundaries (OUT OF SCOPE)
The following features are strictly **deferred** and must not be included in Phase 3 implementation:
- **Multi-technician assignment**: All requests are 1:1 with a single technician.
- **Recurring services**: Automated scheduling of repeating maintenance.
- **Subscription maintenance**: Tiered service plans or contracts.
- **AI Routing**: Automated dispatch or intelligent technician matching.
- **Auto-approvals**: System-generated approval of quotes or verifications.

## 9. Audit Expectations
The system operates on a fail-closed architecture. Every significant domain event MUST generate an audit log via the Service Layer:
- All state transitions.
- Assignment and reassignment events.
- Verification submissions and outcomes.
- Approvals and Super Admin overrides.
- Cancellations and technician declines (must include reason codes).
- Escalation triggers and path movements.

## 10. Dependencies
- **Phase 2 RBAC**: For identifying owners and enforcing permission-based gates.
- **Audit Service**: Foundation for persisting all required event logs.

## 11. Completion Criteria
- All 10 categories and their definitions confirmed.
- SLA response targets and timer rules finalized.
- Cross-domain matrix (Payment/Booking/Verification) approved.
- MVP constraints (1:1 Booking, 1:1 Technician) acknowledged.

## 12. Open Questions
- **Maintenance Verification**: UNRESOLVED — BUSINESS DECISION REQUIRED (Is physical verification mandatory for standard maintenance?)
- **Booking Verification**: UNRESOLVED — BUSINESS DECISION REQUIRED (Does a standard booking request require a verification step?)
- **Product Verification**: UNRESOLVED — BUSINESS DECISION REQUIRED (Is verification required for physical product delivery?)
- **Warranty Verification**: UNRESOLVED — BUSINESS DECISION REQUIRED (Is verification required for warranty-covered repairs?)
