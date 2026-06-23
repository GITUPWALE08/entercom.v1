# Request Services Architecture

## 1. Purpose
The purpose of this document is to define the architectural responsibilities and functional boundaries of the service layer within the Request domain. It ensures a clear separation of concerns, facilitating a robust, fail-closed, and highly auditable Request Lifecycle System.

## 2. Scope
This document covers the high-level responsibilities, inputs, outputs, domain events, and audit requirements for the following services:
- RequestService
- AssignmentService
- QuoteService
- VerificationService
- EscalationService
- SLAService

## 3. Out of Scope
- Concrete method signatures or implementation code.
- Database model field definitions.
- Frontend component architecture.
- Specific communication protocols (e.g., specific WebSocket message formats).

## 4. Definitions
- **Service Layer**: The primary location for business logic, ensuring that domain rules are consistently applied regardless of the entry point (API, CLI, or System Task).
- **Fail-Closed**: An architectural principle where any failure in logic or permissions results in the system remaining in its current secure state rather than proceeding to an uncertain or unauthenticated one.

## 5. Detailed Service Sections

### 5.1 RequestService
*   **Purpose**: Orchestrates the core lifecycle transitions and canonical state management for all request categories.
*   **Responsibilities**:
    *   Creation and persistence of `draft` requests.
    *   Transitioning requests from `draft` to `submitted`.
    *   Enforcing category-specific state skipping logic (e.g., Information requests bypassing assignment).
    *   Managing terminal states (`completed`, `cancelled`).
    *   Handling parent-child relationship inheritance (Customer, Location, Evidence).
*   **Inputs**: Customer identity, Category, Priority, Description, Location Data, Evidence.
*   **Outputs**: Request record status, Lifecycle transition results.
*   **Events Produced**: `request.created`, `request.submitted`, `request.status_changed`, `request.cancelled`.
*   **Audit Requirements**: Must log every state transition with actor identity, previous/new state, and timestamp.
*   **Ownership Boundaries**: Owns the Request entity integrity and state machine transitions.

### 5.2 AssignmentService
*   **Purpose**: Manages the matching and binding of technicians to requests.
*   **Responsibilities**:
    *   Transitioning requests to the `assigned` state.
    *   Enforcing the MVP rule of 1 request to 1 technician.
    *   Handling explicit technician acceptance and decline workflows.
    *   Managing the 48-hour acceptance timeout.
    *   Tracking cumulative decline counts and triggering escalation on the 3rd decline.
*   **Inputs**: Request ID, Technician ID, Decline Reason (if applicable).
*   **Outputs**: Assignment status, Decline count updates.
*   **Events Produced**: `request.assigned`, `assignment.accepted`, `assignment.declined`, `assignment.timeout`.
*   **Audit Requirements**: Every assignment, decline (with reason), and timeout must be audited.
*   **Ownership Boundaries**: Owns the relationship between the Request and the assigned Technician.

### 5.3 QuoteService
*   **Purpose**: Governs the financial estimation and customer approval workflow.
*   **Responsibilities**:
    *   Generating `initial` and `revised` quotes (Technicians/Staff).
    *   Enforcing the maximum revision limit (3).
    *   Managing the 30-day quote expiry timer.
    *   Validating customer approval and rejection actions.
    *   Ensuring quote immutability (never overwriting existing versions).
*   **Inputs**: Request ID, Financial Line Items, Version Number, Customer Action.
*   **Outputs**: Quote version status, Revision count.
*   **Events Produced**: `quote.created`, `quote.approved`, `quote.rejected`, `quote.expired`, `quote.revision_requested`.
*   **Audit Requirements**: All financial revisions and approvals must be audited for regulatory compliance.
*   **Ownership Boundaries**: Owns the Quote entity and its versioned history.

### 5.4 VerificationService
*   **Purpose**: Validates completion of work via evidence review before finalization.
*   **Responsibilities**:
    *   Collecting and validating mandatory evidence (Photos, Checklist, Customer ACK, Metadata).
    *   Enforcing category-specific verification mandatory/optional rules.
    *   Managing the rework loop (returning to `in_progress` on failure).
    *   Processing Manager overrides.
*   **Inputs**: Evidence Payload, Reviewer Action, Override Reason.
*   **Outputs**: Verification result (Pass/Fail), Rework instructions.
*   **Events Produced**: `verification.submitted`, `verification.approved`, `verification.rejected`, `verification.overridden`.
*   **Audit Requirements**: Must log all evidence submissions and verification decisions (especially overrides).
*   **Ownership Boundaries**: Owns the Verification evidence record and its approval state.

### 5.5 EscalationService
*   **Purpose**: Handles exceptions and bottlenecks that require managerial intervention.
*   **Responsibilities**:
    *   Transitioning requests to the `escalated` state based on triggers.
    *   Routing escalated requests to the Manager Queue.
    *   Handling manual escalation requests from Staff/Technicians.
    *   Tracking resolution paths and audit trails for escalated items.
*   **Inputs**: Trigger ID (SLA Breach, Decline Count, etc.), Manager Resolution.
*   **Outputs**: Escalation status, Routing destination.
*   **Events Produced**: `escalation.triggered`, `escalation.resolved`.
*   **Audit Requirements**: Every escalation trigger and manager resolution must be audited.
*   **Ownership Boundaries**: Owns the Escalation record and management of the Manager Queue.

### 5.6 SLAService
*   **Purpose**: Monitors and enforces Service Level Agreement targets.
*   **Responsibilities**:
    *   Initializing SLA timers at request submission.
    *   Detecting breaches based on priority targets (Emergency, Urgent, Normal, Low).
    *   Triggering priority increases upon breach.
    *   Enforcing the "No Reset on Reassignment" rule.
*   **Inputs**: Request Priority, Submission Timestamp, Current Status.
*   **Outputs**: SLA Compliance Status, Breach Alerts.
*   **Events Produced**: `sla.warning`, `sla.breached`.
*   **Audit Requirements**: Must log all SLA breaches and automated priority bumps.
*   **Ownership Boundaries**: Owns the SLA timer lifecycle and compliance records.

## 6. Dependencies
- **docs/workflows/request-lifecycle.md**: Authoritative state definition.
- **docs/architecture/request/request-domain.md**: Category and Priority definitions.
- **Phase 2 RBAC**: For permission verification before service execution.

## 7. Open Questions
- **Staff/Manager Triage Policy**: UNRESOLVED — BUSINESS DECISION REQUIRED (Does the `RequestService` handle the internal staff assignment to the `staff_review` state, or is that a separate `StaffManagementService`?)

## 8. Completion Criteria
- All six core services defined with distinct architectural boundaries.
- Input/Output flows align with approved workflow documents.
- Audit and Event requirements are explicitly stated for each service.
