# Request Auditing Requirements

## 1. Purpose
The purpose of this document is to define the forensic and compliance audit requirements for the Request Lifecycle System. It ensures that every significant change to a request or its associated entities (Quotes, Assignments, Verifications) is recorded in an immutable, tamper-resistant trail.

## 2. Scope
- Definition of audit-mandatory operations.
- Specification of required audit fields and forensic metadata.
- Identification of high-risk, financial, and quality-gate audit points.
- Immutability and compliance expectations.

## 3. Out of Scope
- Technical implementation of DB triggers or Celery tasks.
- Log rotation or archival storage policy.
- Performance tuning of the audit database.

## 4. Definitions
- **Immutable Audit**: A log record that, once written, cannot be modified or deleted, even by system administrators (enforced at the DB trigger level).
- **High-Risk Operation**: Any action that bypasses standard gates, overrides quality failures, or manually resolves an escalation.

## 5. Required Audit Fields
Every audit record generated in Phase 3 MUST include the following attributes:
- **actor**: UUID of the authenticated user or system identity.
- **action**: Canonical event name (e.g., `quote.approved`, `verification.overridden`).
- **timestamp**: ISO8601 precise record of the event.
- **correlation_id**: ID linking the audit record to the specific request session/transaction.
- **request_id**: UUID of the target request.
- **previous_state**: The state prior to the action.
- **new_state**: The state following the action.
- **reason**: Mandatory human-readable text or code for high-risk and terminal transitions.
- **ip_address**: The network origin of the request.
- **user_agent**: The software client used to perform the action.

## 6. Audit Categories

### 6.1 Financial Operations (Critical)
Any action involving monetary estimates or commitments must be audited with full forensic detail:
- `quote.created`: Must log version number and total amount.
- `quote.approved`: Must log the customer identity and approval method.
- `quote.revision_requested`: Must log the justification for revision.
- `quote.expired`: Automated system-level audit.

### 6.2 Verification & Quality Operations
- `verification.submitted`: Log of all evidence links and technician identity.
- `verification.rejected`: Must include the specific QA failure notes.
- `verification.overridden`: **Highest Severity Audit**. Must record the Manager identity, the original failure, and the override justification.

### 6.3 Escalation & Managerial Intervention
- `escalation.triggered`: Log the specific trigger (e.g., SLA Breach, 3 Declines).
- `escalation.resolved`: Log the resolution type and manual re-routing path.
- `cancellation.approved`: Manager-approved cancellation of `in_progress` work.

### 6.4 Assignment Lifecycle
- `request.assigned`: Mapping of Staff to Technician.
- `assignment.declined`: Mandatory recording of the decline reason code.
- `assignment.timeout`: System-detected failure to accept within 48 hours.

## 7. Immutable Audit Expectations
- **Fail-Closed Persistence**: If the audit write fails, the business transaction must rollback (for critical events).
- **Dual-Write Integrity**: Forensic logs are emitted to the system stream *before* the DB transaction completes to prevent loss on rollback.
- **Tamper Resistance**: Audit tables must have row-level protection against `UPDATE` and `DELETE` operations.

## 8. Dependencies
- **docs/workflows/reason-codes.md**: For standard reason data.
- **apps/audit_logs**: The central audit infrastructure (Phase 2).

## 9. Open Questions
- **Metadata Depth**: UNRESOLVED — BUSINESS DECISION REQUIRED (Should audits for `installation` include specific geolocation coordinates of the technician at the time of submission?)

## 10. Completion Criteria
- Every transition in the State Machine has a corresponding Audit requirement.
- High-risk operations (Overrides, Escalations) are assigned maximum forensic depth.
- Financial operation audits satisfy standard compliance oversight requirements.
