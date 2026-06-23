# Request Service Design

## 1. File Purpose
Defines the functional logic, transaction boundaries, and locking requirements for the service layer in the Request domain.

## 2. Scope
*   Core logic for Request, Assignment, Quote, Verification, Escalation, and SLA services.
*   Inter-service communication and dependency mapping.
*   Data integrity via transactions and row-level locking.

## 3. Out of Scope
*   Specific method signatures or code implementations.
*   Frontend component design.

## 4. Full Content

### 4.1 RequestService
*   **Responsibilities**: Manages the canonical lifecycle states (draft -> completed/cancelled). Handles category-specific state skipping and parent-child inheritance.
*   **Inputs**: Customer ID, Category, Priority, Data Payload.
*   **Outputs**: Request object, Status confirmation.
*   **Transaction Boundary**: Single-record transaction for basic state updates.
*   **Locking Requirements**: `select_for_update` on Request row during state transition to prevent race conditions.
*   **Audit Requirements**: Log every `status_changed` event with `previous_state` and `new_state`.

### 4.2 AssignmentService
*   **Responsibilities**: Manages 1:1 technician binding. Handles explicit acceptance/decline and increments decline counters. Triggers escalation.
*   **Inputs**: Request ID, Technician ID, Reason Code (if declining).
*   **Outputs**: Assignment status.
*   **Transaction Boundary**: Atomic update of Request (Technician FK) and Assignment history table.
*   **Locking Requirements**: Row lock on Request to safely increment `decline_count`.
*   **Audit Requirements**: Log `request.assigned`, `assignment.accepted`, or `assignment.declined` (with reason).

### 4.3 QuoteService
*   **Responsibilities**: Governs quote versioning (v1, v2, v3). Enforces 3-revision limit and 30-day expiry. Blocks approval if expired.
*   **Inputs**: Request ID, Amount, Action (Approve/Reject/Revise).
*   **Outputs**: Quote version, Request state change.
*   **Transaction Boundary**: Single transaction to mark old quote `superseded` and create new `revised` version.
*   **Locking Requirements**: Lock on Request to ensure revision count consistency.
*   **Audit Requirements**: Detailed financial trail for `quote_created`, `quote_revised`, `quote_approved`.

### 4.4 VerificationService
*   **Responsibilities**: Validates mandatory evidence for `installation` and `maintenance`. Handles Manager overrides.
*   **Inputs**: Request ID, Evidence Payload, Approver/Manager ID.
*   **Outputs**: Verification result.
*   **Transaction Boundary**: Atomic state change from `pending_verification` to `completed` or `in_progress` (rework).
*   **Locking Requirements**: `select_for_update` on Request to prevent concurrent approvals.
*   **Audit Requirements**: High-integrity log for `verification_passed`, `verification_rejected`, or `verification_overridden`.

### 4.5 EscalationService
*   **Responsibilities**: Routes requests to the `escalated` state based on system triggers (SLA, Declines, Outages).
*   **Inputs**: Trigger Type, Request ID.
*   **Outputs**: Escalation record.
*   **Transaction Boundary**: Creates Escalation record and updates Request state.
*   **Locking Requirements**: Lock on Request to prevent duplicate escalation triggers.
*   **Audit Requirements**: Log `escalation_triggered` with detailed reason.

### 4.6 SLAService
*   **Responsibilities**: Initializes and monitors SLA targets. Escalates on breach.
*   **Inputs**: Priority, Start Time.
*   **Outputs**: Target Time, Compliance status.
*   **Transaction Boundary**: Independent monitoring tasks (background).
*   **Locking Requirements**: None (Read-only status checks).
*   **Audit Requirements**: Log `sla_breach` event.

### 4.7 Background Job Service Methods

#### `QuoteService.expire_quotes()`
*   **Purpose**: Sweeps the database for quotes exceeding the 30-day limit and expires them, cancelling the associated request.
*   **Inputs**: None (Internal Query).
*   **Outputs**: List of expired Quote IDs.
*   **Events Emitted**: `quote.expired`, `request.cancelled`.
*   **Audit Requirements**: Log `quote.expired` and `request.cancelled` per affected quote.
*   **Transaction Requirements**: Atomic per request/quote pair to ensure both are updated together.
*   **Failure Behavior**: Fail-closed; if request cancellation fails, the quote expiry must roll back.

#### `SLAService.check_breaches()`
*   **Purpose**: Scans active requests to detect if current time exceeds `sla_target_time`.
*   **Inputs**: None (Internal Query).
*   **Outputs**: List of breached Request IDs.
*   **Events Emitted**: `sla.breached`, `escalation.triggered`.
*   **Audit Requirements**: Log `sla_breach_detected` with delay interval.
*   **Transaction Requirements**: Atomic update per request to apply priority bump and trigger escalation.
*   **Failure Behavior**: Skip the affected record and log the error; continue processing the rest of the batch.

#### `AssignmentService.handle_timeout()`
*   **Purpose**: Detects assignments in `assigned` state older than 48 hours, revokes the assignment, and increments the decline count.
*   **Inputs**: None (Internal Query).
*   **Outputs**: List of processed Assignment IDs.
*   **Events Emitted**: `assignment.timeout`.
*   **Audit Requirements**: Log `assignment.timeout_recorded`.
*   **Transaction Requirements**: Row lock on Request to safely increment `decline_count` and unbind the technician.
*   **Failure Behavior**: Skip the affected record and log the error; continue processing the rest of the batch.

#### `EscalationService.process_escalation()`
*   **Purpose**: Routes newly escalated requests to the Manager Queue and ensures notifications are dispatched.
*   **Inputs**: Request ID, Trigger Type.
*   **Outputs**: Escalation Record.
*   **Events Emitted**: `escalation.triggered`.
*   **Audit Requirements**: Log `escalation_triggered`.
*   **Transaction Requirements**: Ensure escalation record creation and request state update are atomic.
*   **Failure Behavior**: Revert request state if escalation routing fails.
