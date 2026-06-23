# Escalation Flow

## 1. Purpose
Defines the automated and manual paths for routing requests that require managerial intervention due to bottlenecks, failures, or critical priorities.

## 2. Scope
- Triggers for escalation.
- Routing hierarchy and ownership.
- Outcomes of SLA breaches.

## 3. Out of Scope
- Standard request routing and initial triage.
- Notification transport protocols (SMTP, SMS gateways).

## 4. Definitions
*   Refer to `docs/architecture/request/domain-glossary.md`.

## 5. Rules
*   **Escalation Ownership**: Requests in the `escalated` state are owned exclusively by **Managers**.
*   **SLA Breach Mechanics**: An SLA breach automatically triggers a manager notification AND an increase in the request's priority level.
*   **Escalation Timeout**: If an escalated request times out without manager action, behavior is strictly manual handling only (no automated forced closures).
*   **Fail-Closed**: If escalation routing fails, the request must flag an emergency system log and remain visible in its current state.

## 6. Required Matrices/Tables

### Trigger → Route → Outcome Table
| Trigger | Route (Owner) | Expected Outcome / Resolution Path |
| :--- | :--- | :--- |
| **3 technician declines** | Manager | Manual reassignment or cancellation |
| **Assignment timeout** | Manager | Manual reassignment or priority bump |
| **SLA breach** | Manager | Priority increase + immediate review |
| **Device outage delays** | Manager | Emergency dispatch |
| **Manual escalation** | Manager | Resolution based on manual input |

## 7. Edge Cases
*   **Manager Absence**: If a manager is unavailable during an escalation timeout, the manual handling requirement implies it sits in the queue until reviewed. 

## 8. Audit Expectations
Every escalation must be logged with:
*   `actor` (System for automated, User ID for manual)
*   `action` (e.g., `request.escalated`)
*   `timestamp`, `correlation_id`, `request_id`
*   `previous_state`, `new_state` (`escalated`)
*   `reason` (The specific trigger, e.g., "SLA breached by 2 hours")


## 9. Dependencies
- docs/workflows/reason-codes.md
*   `docs/workflows/request-lifecycle.md` (State transitions).
*   `docs/workflows/sla-policy.md` (SLA trigger definitions).

## 10. Completion Criteria
All triggers, routing destinations, and resolution expectations are finalized.

## 11. Open Questions
*   UNRESOLVED — BUSINESS DECISION REQUIRED (Are there scenarios where a Super Admin is automatically looped into unresolved escalations after a secondary timeout?) - Ans: for MVP, NO
