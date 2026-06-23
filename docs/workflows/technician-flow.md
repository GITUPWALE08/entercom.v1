# Technician Flow Workflow

## 1. Purpose
Outlines the permitted capabilities, actions, and expectations for technicians interacting with the request lifecycle, ensuring strict boundaries on field operations.

## 2. Scope
- Permitted technician actions.
- Remote resolution capabilities.
- Offline support concepts.

## 3. Out of Scope
- Multi-technician collaboration features (MVP Boundary).
- Implementation details of offline synchronization (local database sync algorithms, conflict resolution code).

## 4. Definitions
*   Refer to `docs/architecture/request/domain-glossary.md`.

## 5. Rules
*   **Capabilities**: A technician is authorized ONLY to:
    1. Accept an assignment.
    2. Decline an assignment (requires reason).
    3. Perform work (transition to/operate in `in_progress`).
    4. Submit verification evidence.
    5. Escalate blocked work.
*   **Remote Resolution**: The system explicitly supports remote resolution. For `support` and `information` categories, Staff may resolve the request directly without ever assigning a technician.
*   **Offline Support**: Technicians operate in environments with poor connectivity. The system conceptually supports offline data capture (e.g., saving evidence locally); sync occurs when connectivity is restored. Also techniian can only access request/job info offline only after accepting.

## 6. Required Matrices/Tables
*(N/A - Flow defined in lifecycle and assignment docs)*

## 7. Edge Cases
*   **Offline Sync Conflicts**: Handled conceptually; if an offline technician accepts a request that was reassigned due to timeout, the server must fail-closed and reject the stale offline acceptance.

## 8. Audit Expectations
Must log:
*   `actor`, `action`, `timestamp`, `correlation_id`, `request_id`, `previous_state`, `new_state`, `reason`
*   Any escalation initiated by the technician must include context.

## 9. Dependencies
*   `docs/workflows/assignment-policy.md`

## 10. Completion Criteria
Capabilities are tightly scoped and remote resolution by staff is explicitly allowed.

## 11. Open Questions
*   UNRESOLVED — BUSINESS DECISION REQUIRED (Exact conflict resolution business rules if offline data syncs after a request has been cancelled by staff). Ans: it will not be a conflict since technician can be assumed to know that they are offline, so when accepting request they need to be online, they will only have access to assignments info offline only after accepting.