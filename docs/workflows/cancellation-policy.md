# Cancellation Policy Workflow

## 1. Purpose
Termination boundaries. Dictates the permission boundaries and lifecycle constraints for cancelling a request. It prevents data corruption and stops customers from aborting work that is already underway.


## 2. Scope
- Role-based cancellation permissions (Customer, Staff, Manager).
- State-based cancellation restrictions.
- Payment refund prerequisites.

## 3. Out of Scope
- Automated refund processing APIs.
- Self-healing system cancellations.

## 4. Definitions
*   Refer to `docs/architecture/request/domain-glossary.md`.

## 5. Rules
*   **Customer**: Allowed ONLY before assignment.
*   **Staff**: Free before assignment; Manager approval AFTER assignment.
*   **Completed**: NEVER cancelled.
*   **Refunds**: Strictly manual review. Any cancellation involving processed payments requires a **manual review**. Automatic refunds are disabled.

## 6. Matrices/Tables
| Role | Assigned | In-Progress | Completed |
| :--- | :--- | :--- | :--- |
| Customer | Prohibited | Prohibited | Prohibited |
| Staff | Mgr Appr Req | Mgr Appr Req | Prohibited |
| Manager | Allowed | Allowed | Prohibited |

### Cancellation Authority & State Matrix
| Role | Allowed to Cancel In | Prohibited from Cancelling In | Special Conditions |
| :--- | :--- | :--- | :--- |
| **Customer** | `draft`, `submitted`, `staff_review`, `awaiting_quote`, `awaiting_customer_approval`, `awaiting_payment`, `awaiting_assignment` | `assigned`, `in_progress`, `pending_verification`, `completed` | Customer may cancel ONLY before assignment. |
| **Staff** | Before assignment (freely) | `completed` | Requires **Manager Pre-Approval** to cancel after assignment. |
| **Manager** | Any non-completed state | `completed` | Holds ultimate cancellation authority for active items. |

## 7. Edge Cases
*   **In-flight Cancellation by Staff**: If a technician is actively `in_progress` and staff initiates a manager-approved cancellation, the technician must be instantly notified and offline work must be voided upon sync.

## 8. Audit Expectations
Must log:
*   `actor`, `action`, `timestamp`, `correlation_id`, `request_id`, `previous_state`, `new_state` (`cancelled`), `reason` (Mandatory reason required for all cancellations).

## 9. Dependencies
- docs/workflows/reason-codes.md
*   `docs/workflows/request-lifecycle.md`

## 10. Completion Criteria
Clear boundaries drawn protecting in-progress work from unauthorized customer or staff cancellation.

## 11. Open Questions
*   UNRESOLVED — BUSINESS DECISION REQUIRED (If a request is cancelled awaiting a refund review, does it sit in a secondary billing state, or just `cancelled` with an external flag?) - Ans: for a request requiring refund should be automatically cancelled, but wait for manager approval, so that means the manager should only approve it after refund successful