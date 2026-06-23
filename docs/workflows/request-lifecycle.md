# Request Lifecycle

## 1. Purpose

This document defines the canonical state machine and request lifecycle for Phase 3 (Request Lifecycle System). It establishes a single, universal lifecycle for all request categories across the modular monolith, enforcing strict transition paths, mandatory gates (payment, quote, verification), and security auditing. It acts as the absolute source of truth for service-layer lifecycle implementations.

## 2. Scope

*   Universal canonical lifecycle states for all request categories (installation, inspection, maintenance, support, information, booking, product_order, device_outage, consultation, warranty).
*   State transition rules, constraints, and prerequisites.
*   Permission, payment, quote, and verification gates.
*   Cancellation, rework, and escalation routing rules.
*   SLA implications during state transitions.
*   Mandatory audit event payloads for lifecycle changes.

## 3. Out of Scope

*   Multi-technician or team assignment logic.
*   Recurring bookings or subscription maintenance workflows.
*   AI-based automation, routing, or auto-approvals.
*   Advanced scheduling algorithms.
*   Complex payment gateway flows (e.g., partial payments, financing).
*   Database schemas, API endpoints, serializer logic, and frontend UI states.

## 4. Lifecycle Principles

*   **Universal Applicability**: A single canonical lifecycle is used for all 10 request categories.
*   **State Skipping**: Categories may skip unnecessary states based on specific business rules (e.g., bypassing `awaiting_quote`).
*   **Fail-Closed Architecture**: Any transition failing a gate requirement (e.g., payment validation) must result in the request remaining in its current state.
*   **Auditability**: Every movement between states is a permanent, immutable record.

## 5. Canonical State Definitions

### draft
*   **Purpose**: Initial request construction before system processing.
*   **Who owns it**: Customer.
*   **Who can transition**: Customer.
*   **Entry conditions**: Customer initiates a new request.
*   **Exit conditions**: Customer successfully completes submission.

### submitted
*   **Purpose**: Request has been officially entered into the system.
*   **Who owns it**: Staff Queue.
*   **Who can transition**: Staff, System.
*   **Entry conditions**: Request payload successfully saved and validated.
*   **Exit conditions**: Staff picks up the request for review.

### staff_review
*   **Purpose**: Triage, categorization, and initial processing.
*   **Who owns it**: Staff.
*   **Who can transition**: Staff.
*   **Entry conditions**: Staff accepts request from the queue.
*   **Exit conditions**: Staff determines the next required phase (quote, payment, or direct assignment).

### awaiting_quote
*   **Purpose**: Waiting for staff or technician to generate a financial estimate.
*   **Who owns it**: Staff / Technician.
*   **Who can transition**: Staff, Technician.
*   **Entry conditions**: Category requires a quote, or onsite inspection completes.
*   **Exit conditions**: Quote is generated and issued.

### awaiting_customer_approval
*   **Purpose**: Waiting for customer to accept or reject the quote.
*   **Who owns it**: Customer.
*   **Who can transition**: Customer, System (on timeout).
*   **Entry conditions**: Quote generated and sent to customer.
*   **Exit conditions**: Customer approves quote, rejects quote, requests revision, or quote expires.

### awaiting_payment
*   **Purpose**: Holding state until mandatory funds are secured.
*   **Who owns it**: Customer.
*   **Who can transition**: System (Payment Gateway webhook).
*   **Entry conditions**: Quote approved (if applicable) and category requires upfront payment.
*   **Exit conditions**: Full payment confirmed by system.

### awaiting_assignment
*   **Purpose**: Request is fully authorized and funded; ready for scheduling.
*   **Who owns it**: Staff Queue.
*   **Who can transition**: Staff.
*   **Entry conditions**: All required approvals and payment gates are cleared.
*   **Exit conditions**: Staff assigns a specific technician.

### assigned
*   **Purpose**: Technician matched; awaiting explicitly acceptance.
*   **Who owns it**: Technician.
*   **Who can transition**: Technician, System (on timeout).
*   **Entry conditions**: Staff assigns technician.
*   **Exit conditions**: Technician accepts assignment, declines, or 48-hour timeout occurs.

### in_progress
*   **Purpose**: Active execution of requested services or diagnostics.
*   **Who owns it**: Technician (or Staff for remote resolution).
*   **Who can transition**: Technician, Staff.
*   **Entry conditions**: Technician accepts assignment and scheduling is confirmed.
*   **Exit conditions**: Work is completed and evidence (if any) is submitted.

### pending_verification
*   **Purpose**: Quality assurance and evidence review.
*   **Who owns it**: Staff / Manager.
*   **Who can transition**: Staff, Manager.
*   **Entry conditions**: Technician marks work as finished and submits required evidence.
*   **Exit conditions**: Work is verified (approved) or rejected (rework required).

### escalated
*   **Purpose**: Exception handling requiring higher-tier intervention.
*   **Who owns it**: Manager.
*   **Who can transition**: Manager.
*   **Entry conditions**: Escalation trigger hit (SLA breach, 3 declines, timeout, manual).
*   **Exit conditions**: Manager resolves the blocker and re-routes the request.

### completed
*   **Purpose**: Terminal state indicating successful fulfillment.
*   **Who owns it**: System / Archive.
*   **Who can transition**: None (Immutable terminal state).
*   **Entry conditions**: Verification passed or category finishes execution natively.
*   **Exit conditions**: None.

### cancelled
*   **Purpose**: Terminal state indicating aborted request.
*   **Who owns it**: System / Archive.
*   **Who can transition**: None (Immutable terminal state).
*   **Entry conditions**: Valid cancellation action by authorized actor.
*   **Exit conditions**: None.

## 6. Lifecycle Diagram (ASCII)

```text
[draft] --> [submitted] --> [staff_review] ----.
                                |              |
                                v              |
                        [awaiting_quote]       |
                                |              |
                                v              |
                 [awaiting_customer_approval]  |
                                |              |
                                v              |
           .---------- [awaiting_payment] <----'
           |                    |
           |                    v
           '---------> [awaiting_assignment] <-------. (Reassign)
                                |                    |
                                v                    |
                           [assigned] ---------------' (Decline/Timeout)
                                |
                                v (Accept)
     .------------------> [in_progress] <------------.
     |                          |                    |
     |                          v                    |
     |               [pending_verification] ---------' (Rework)
     |                          |
     |                          v
[cancelled]                [completed] <---------- [escalated]
```

## 7. Transition Matrix

| Current State | Allowed Next State | Actor | Required Permission | Blocking Conditions | Audit Required |
| :--- | :--- | :--- | :--- | :--- | :--- |
| draft | submitted | Customer | request.create | Missing required fields | Yes |
| submitted | staff_review | Staff | request.triage | None | Yes |
| staff_review | awaiting_quote | Staff | request.triage | Category skips quote | Yes |
| staff_review | awaiting_payment | Staff | request.triage | Category skips quote | Yes |
| staff_review | awaiting_assignment| Staff | request.triage | Category skips quote & payment| Yes |
| awaiting_quote | awaiting_customer_approval | Staff/Tech | quote.create | Quote not finalized | Yes |
| awaiting_customer_approval| awaiting_payment | Customer | quote.approve | Quote not approved | Yes |
| awaiting_customer_approval| awaiting_assignment | Customer | quote.approve | Quote not approved | Yes |
| awaiting_payment | awaiting_assignment | System | system.webhook | Payment failed/unconfirmed | Yes |
| awaiting_assignment | assigned | Staff | request.assign | Payment unconfirmed (if req) | Yes |
| assigned | in_progress | Technician | assignment.accept | 48h Timeout | Yes |
| assigned | awaiting_assignment| Technician | assignment.decline| Missing decline reason | Yes |
| in_progress | pending_verification | Technician | request.update | Missing mandatory evidence | Yes |
| in_progress | completed | Technician | request.update | Category requires verification| Yes |
| pending_verification | completed | Staff/Manager | request.verify | Evidence insufficient | Yes |
| pending_verification | in_progress | Staff/Manager | request.verify | None (Rework triggered) | Yes |
| Any (Non-terminal) | escalated | System/Staff| request.escalate | Trigger condition not met | Yes |
| escalated | Any | Manager | request.resolve | None | Yes |
| Any (Non-terminal) | cancelled | Varies | request.cancel | Manager pre-approval needed | Yes |

## 8. Payment Gates

Mandatory payment must be confirmed in `awaiting_payment` state before the request can transition to `awaiting_assignment` for the following categories:
*   `installation`
*   `maintenance`
*   `product_order`

No payment is required for `inspection`, `support`, or `information`.
For `device_outage`, payment may occur after onsite diagnosis.

## 9. Quote Approval Gates

For any category requiring a quote:
1. Customer must perform `approve_quote` AND
2. Make payment (if applicable) BEFORE technician assignment (`awaiting_assignment`).

**Inspection Specifics:** Inspection scheduling occurs BEFORE quote generation, because the quote is generated after the onsite inspection.

## 10. Verification Gates

Verification is the quality gate between `in_progress` and `completed`.
*   **Mandatory**: `installation`, `maintenance`.
*   **Optional**: `inspection`.
*   **None**: `support`, `information`, `product_order`.

**Mandatory installation evidence**:
*   Photos
*   Signed checklist
*   Customer acknowledgment
*   Geo/timestamp metadata

**Verification Authority**: Staff. Manager override is allowed.
**Verification Failure**: Returns request to `in_progress`. Repeated failures trigger manager escalation.

## 11. Cancellation Rules

### Customer Cancellation
*   **Allowed in**: `draft`, `submitted`, `staff_review`, `awaiting_quote`, `awaiting_customer_approval`, `awaiting_payment`, `awaiting_assignment`.
*   **Prohibited in**: `assigned`, `in_progress`, `pending_verification`, `completed`.
*   Customer may cancel ONLY before assignment.

### Staff Cancellation
*   **Allowed freely before assignment**.
*   **After assignment**: Manager PRE-APPROVAL is required.

### Manager Cancellation
*   May cancel any non-completed request.

### Completed Requests
*   **Completed requests cannot be cancelled.**

### Payment Refunds
*   Payment-related cancellation refunds require manual review.

## 12. Assignment Rules

*   **MVP Constraint**: Strictly single technician assignment (1 request → 1 technician). NO team assignment.
*   **Acceptance Constraint**: Scheduling happens ONLY after technician acceptance.
*   **Timeout**: Technician has 48 hours to accept. No response counts as a decline.
*   **Decline Behavior**: A decline does NOT create a separate lifecycle state. It increments the decline count, requires a mandatory reason (e.g., `out_of_area`, `overloaded`, `lack_of_skill`, `unavailable`, `safety_concern`, `other`), and returns the request to `awaiting_assignment` for reassignment.
*   3 cumulative declines/timeouts → escalation.

## 13. Rework Loops

*   **Rework Path**: `pending_verification` → `in_progress`.
*   Occurs when verification fails. The request returns to the technician for correction.
*   Example: `pending_verification` ↓ `rejected` ↓ `in_progress`.

## 14. Escalation Rules

*   **Owner**: Manager only.
*   **Triggers**: 3 technician declines, assignment timeout, SLA breach, manual escalation, device_outage delays.
*   **SLA Breach Effect**: Triggers manager notification and priority increase.
*   **Escalation Timeout Behavior**: Manual handling only.
*   **Audit**: Escalation paths, routing, and outcomes must be logged.

## 15. SLA Implications

*   SLA starts precisely at request submission time.
*   Reassignment does NOT reset the SLA timer.
*   All checks and calculations are fail-closed.

## 16. Audit Requirements

Every important action and state change MUST be audited via centralized services. Immutability is mandatory. 

Audit logs MUST include:
*   `actor`
*   `previous_state`
*   `new_state`
*   `timestamp`
*   `correlation_id`
*   `reason` (where applicable)
*   `request_id`
*   `action`

## 17. Edge Cases

*   **Information/Support Flow**: `support` and `information` requests may be resolved directly by staff without technician assignment.
*   **Offline Support**: Technicians may work offline. Syncing and state changes will reconcile upon reconnection (conceptual documentation only).
*   **Quote Revisions**: Maximum 3 revisions. If revision limit exceeded: Quote expires

## 18. Dependencies
- docs/workflows/reason-codes.md

*   `docs/architecture/request/request-domain.md`
*   `docs/architecture/request/domain-glossary.md`

## 19. Completion Criteria

*   Universal canonical state machine mapped.
*   Gates (payment, quote, verification) established for all categories.
*   Roles (Customer, Staff, Manager) defined with permissions per state transition.
*   Cancellation and escalation bounds explicitly recorded.