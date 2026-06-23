# Booking Cancellation Policy

## 1. Purpose
The purpose of this document is to define the workflow, rules, and dependencies for cancelling a Booking within the Entercom platform. It strictly aligns Booking cancellation with the parent Request cancellation workflow, particularly detailing the handling of refunds.

## 2. Scope
This document covers:
* The subordination of Booking cancellation to Request cancellation.
* The Refund-Based Cancellation Workflow.
* Managerial approval dependencies.
* Lifecycle state boundaries during cancellation processing.

## 3. Out of Scope
* Technical integrations with third-party payment gateways.
* Code implementation for state machine transitions.
* Database schema definitions.

## 4. Definitions
* **Refund Dependency:** A strict architectural rule stating that final cancellation approval cannot occur until a necessary refund has been successfully processed.

## 5. Rules

### 5.1 Booking Subordination
* Booking cancellation strictly follows the Request cancellation policy defined in Phase 3. The Booking entity has no independent cancellation workflow.

### 5.2 Refund Dependency
* Manager cancellation approval is blocked until refund completion is confirmed.
* Refund completion is a prerequisite for final cancellation approval.

### 5.3 Lifecycle Integrity
* The MVP does not introduce refund lifecycle states, billing-specific lifecycle states, or secondary cancellation states.
* The canonical lifecycle state remains unchanged until cancellation approval is completed.

## 6. Required Matrices/Tables

### Refund-Based Cancellation Workflow

| Step | Action | Description | System State Impact |
| :--- | :--- | :--- | :--- |
| 1 | Initiation | Cancellation is initiated by an authorized actor. | Unchanged (Pending Approval) |
| 2 | Refund Processing | The external or out-of-band refund process begins. | Unchanged (Pending Approval) |
| 3 | Verification | System confirms successful refund processing. | Refund condition met |
| 4 | Manager Approval | Manager explicitly approves the cancellation. | Validated |
| 5 | Execution | System executes the cancellation. | Request transitions to `cancelled`. Booking follows cancellation workflow. |

## 7. Edge Cases
* **Refund Failures:** Handling the workflow if the payment gateway rejects the refund attempt (Approval remains blocked).
* **Zero-Cost Cancellations:** Bypassing the refund dependency entirely when a Booking incurs no upfront cost or cancellation fee.

## 8. Audit Expectations
* The initiation of cancellation, the verification of the refund, and the final Manager approval must be distinctly logged with their respective timestamps and actor IDs in the Audit Log.

## 9. Dependencies
* `docs/architecture/booking/booking-domain.md`
* `docs/workflows/booking-lifecycle.md`
* Phase 3 Cancellation Policy (`docs/workflows/cancellation-policy.md`)

## 10. Completion Criteria
* Service-layer enforcement blocking Manager cancellation approval if a required refund is pending.
* Maintenance of the canonical state (no introduction of `pending_refund` states).

## 11. Open Questions
* None at this time.

## 12. Approved Business Decisions

### 12.1 Refund-Based Cancellation Workflow
**Approved Decision**
For bookings or requests requiring a refund:
1. Cancellation is initiated.
2. Refund process begins.
3. Request remains pending managerial cancellation approval.
4. Manager approval must not occur until refund processing succeeds.
5. After successful refund:
   * Manager approves cancellation.
   * Request transitions to `cancelled`.
   * Booking follows cancellation workflow.

MVP does not introduce:
* Refund lifecycle states
* Billing-specific lifecycle states
* Secondary cancellation states

The canonical lifecycle state remains unchanged until cancellation approval is completed.
