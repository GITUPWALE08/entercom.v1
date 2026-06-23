# SLA Policy Workflow

## 1. Purpose
Defines the Service Level Agreement (SLA) targets, operational rules, and breach consequences to ensure timely request handling and high customer satisfaction.

## 2. Scope
- Priority levels and time targets.
- SLA timer lifecycle (start, pause, resume).
- Breach handling.

## 3. Out of Scope
- Complex variable SLA calculations based on geolocation or customer VIP tiers.

## 4. Definitions
*   Refer to `docs/architecture/request/domain-glossary.md`.

## 5. Rules
*   **Start Condition**: The SLA timer begins exactly at the moment of **request submission**.
*   **Reassignment Constraint**: Reassigning a request to a new technician does NOT reset the SLA timer.
*   **Breach Consequence**: Breaching the SLA target results in two mandatory actions:
    1. Manager Notification.
    2. Priority Increase (e.g., Normal → Urgent).

## 6. Required Matrices/Tables

### Priority & Response Targets
| Priority | Response Target |
| :--- | :--- |
| **emergency** | < 24 hours |
| **urgent** | < 3 working days |
| **normal** | < 5 working days |
| **low** | < 7 working days |

## 7. Edge Cases
*   **Weekend Submissions**: Business logic must account for "working days" vs standard hours for applicable priority levels.

## 8. Audit Expectations
Must log:
*   `actor` (System), `action` (e.g., `sla.breached`), `timestamp`, `correlation_id`, `request_id`, `previous_state`, `new_state` (if priority escalated), `reason`.

## 9. Dependencies
*   `docs/workflows/escalation-flow.md`

## 10. Completion Criteria
SLA targets align perfectly with business decisions and breach penalties are strict.

## 11. Open Questions
*   **Pause and Resume**: UNRESOLVED — BUSINESS DECISION REQUIRED (Under what specific circumstances, if any, can an SLA timer be paused and subsequently resumed?)- Ans: For MVP, No circumstance