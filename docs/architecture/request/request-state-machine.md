# Request State Machine Architecture

## 1. Purpose
The purpose of this document is to translate the approved Phase 3 Request Lifecycle into a formal implementation architecture. it defines the technical guardrails, ownership mappings, and state transition logic required to build a reliable and secure state machine.

## 2. Scope
- Canonical state machine configuration.
- Technical ownership boundaries for each state.
- Guard conditions and mandatory gates (Payment, Quote, Verification).
- Rework loops and terminal state constraints.
- Exhaustive state transition matrix.

## 3. Out of Scope
- Detailed business logic within the service layer (see `docs/architecture/request/request-services.md`).
- Notification delivery mechanics.
- Database trigger or transaction-level implementation.

## 4. Definitions
- **Guard Condition**: A logical prerequisite that must evaluate to TRUE before a state transition is permitted.
- **Terminal State**: A final state in the lifecycle from which no further transitions are allowed.
- **Rework Loop**: A specific path that returns a request to an earlier active state for correction (e.g., from `pending_verification` to `in_progress`).

## 5. Canonical State Machine

### 5.1 State Ownership and Control
| State | Technical Owner | Primary Actor |
| :--- | :--- | :--- |
| `draft` | Customer | Customer |
| `submitted` | System (Staff Queue) | Customer |
| `staff_review` | Staff | Staff |
| `awaiting_quote` | Staff / Technician | Staff / Technician |
| `awaiting_customer_approval` | Customer | Customer |
| `awaiting_payment` | System (Payment Gate) | Customer |
| `awaiting_assignment` | System (Staff Queue) | Staff |
| `assigned` | Technician | Technician |
| `in_progress` | Technician | Technician |
| `pending_verification` | Staff / Manager | Staff / Manager |
| `escalated` | Manager | Manager |
| `completed` | System (Archive) | N/A (Terminal) |
| `cancelled` | System (Archive) | N/A (Terminal) |

### 5.2 Transition Logic Gates
#### Quote Gate
- **Condition**: Must have an `approved_quote` status to exit `awaiting_customer_approval`.
- **Applicability**: `installation`, `maintenance`.

#### Payment Gate
- **Condition**: Must have a `confirmed` payment record to exit `awaiting_payment`.
- **Applicability**: `installation`, `maintenance`, `product_order`.

#### Verification Gate
- **Condition**: Must have `verification_evidence` and a `pass` result from a reviewer to exit `pending_verification`.
- **Applicability**: `installation`, `maintenance`, `inspection` (Optional).

## 6. Detailed Transition Matrix

| Current State | Next State | Trigger | Actor | Guard / Gate |
| :--- | :--- | :--- | :--- | :--- |
| `draft` | `submitted` | Submit Action | Customer | Valid schema |
| `submitted` | `staff_review` | Pick Up | Staff | Staff assigned |
| `staff_review` | `awaiting_quote` | Needs Quote | Staff | Category requires quote |
| `staff_review` | `awaiting_assignment` | Assign Directly | Staff | Payment/Quote not required |
| `awaiting_quote` | `awaiting_customer_approval` | Quote Issued | Staff/Tech | Valid Quote version |
| `awaiting_customer_approval` | `awaiting_payment` | Approve Quote | Customer | Upfront payment req |
| `awaiting_customer_approval` | `awaiting_assignment` | Approve Quote | Customer | No upfront payment req |
| `awaiting_customer_approval` | `awaiting_quote` | Request Revision | Customer | Revision count < 3 |
| `awaiting_customer_approval` | `escalated` | Request Revision | Customer | Revision count >= 3 |
| `awaiting_payment` | `awaiting_assignment` | Payment Webhook| System | Verified transaction |
| `awaiting_assignment` | `assigned` | Assign Tech | Staff | Tech available |
| `assigned` | `in_progress` | Accept | Technician | Within 48h timeout |
| `assigned` | `awaiting_assignment` | Decline | Technician | Decline count < 3 |
| `assigned` | `escalated` | Decline/Timeout | Technician | Decline count >= 3 |
| `in_progress` | `pending_verification` | Mark Finished | Technician | Evidence uploaded |
| `in_progress` | `completed` | Mark Finished | Technician | Verification not req |
| `pending_verification` | `completed` | Approve | Staff/Mgr | QA Pass |
| `pending_verification` | `in_progress` | Reject | Staff/Mgr | QA Fail (Rework) |
| `pending_verification` | `completed` | Override | Manager/SA | Audit justification |
| Any (Non-terminal) | `cancelled` | Cancel Action | Actor | Auth check (Policy) |
| Any (Non-terminal) | `escalated` | System Trigger | System | SLA Breach / Delay |

## 7. Dependencies
- **docs/workflows/request-lifecycle.md**: The source state definitions.
- **docs/workflows/cancellation-policy.md**: Governance for the `cancelled` state.
- **docs/workflows/assignment-policy.md**: Rules for the `assigned` state.

## 8. Open Questions (RESOLVED)
- **Emergency Queue State**: `emergency_queue` a distinct state a state.

## 9. Completion Criteria
- Matrix covers all permitted transitions defined in the approved lifecycle.
- Gate applicability (Payment/Verification/Quote) is clearly mapped.
- Ownership of each transition is architecturally assigned.
