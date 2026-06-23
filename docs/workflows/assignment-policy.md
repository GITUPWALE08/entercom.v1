# Assignment Policy

## 1. Purpose
Rules for allocating requests to field personnel.

## 2. Scope
- Single technician assignment and acceptance gates.
- Technician matching constraints (MVP 1:1 rule).
- The acceptance lifecycle state flow.
- Handling of assignment declines and timeouts.

## 3. Out of Scope
- Multi-technician dispatch algorithms.
- Team assignments.
- Automated AI routing and matching heuristics.

## 4. Definitions
*   Refer to `docs/architecture/request/domain-glossary.md`.

## 5. Rules
*   **MVP Boundary**: strictly single technician assignment.
*   **Explicit Acceptance**: Assignment requires tech action to move to `in_progress`. Technicians must explicitly accept an assignment. Simply being assigned does not imply commitment.
*   **Scheduling Gate**: Scheduling (booking) happens ONLY after the technician accepts the assignment.
*   **Timeout**: 48 hours for acceptance. No response = decline.
*   **Decline Mechanics**: Declines do NOT transition the request to a new lifecycle state. Instead, they:
    1.  Return the request to `awaiting_assignment` (if transitioning back) or remain in an assignable holding pattern.
    2.  Increment the request's internal decline count.
    3.  Require a mandatory reason code.
*   **Escalation Trigger**: 3 cumulative declines (or timeouts) trigger automatic escalation.
*   **Mandatory Reasons**: `out_of_area`, `overloaded`, `lack_of_skill`, `unavailable`, `safety_concern`, `other`.

## 6. Required Matrices/Tables

### Assignment Lifecycle Flow
```text
[ awaiting_assignment ]
          |
          v (Staff assigns)
     [ assigned ]
          |
          +--> (Timeout / Decline) --> Increments counter, returns to pool/queue.
          |
          v (Tech explicitly accepts)
     ( Scheduling occurs )
          |
          v
   [ in_progress ]
```

## 7. Edge Cases
*   **Future SLA Variation**: Variation of assignment timeout limits by priority (e.g., Emergency requests timeout faster) is considered **future scope only**.

## 8. Audit Expectations
Must log:
*   `actor`, `action`, `timestamp`, `correlation_id`, `request_id`, `previous_state`, `new_state`
*   `reason`: Mandatory for all declines (e.g., `out_of_area`, `overloaded`, `lack_of_skill`, `unavailable`, `safety_concern`, `other`).

## 9. Dependencies
- docs/workflows/reason-codes.md
*   `docs/workflows/request-lifecycle.md`
*   `docs/workflows/technician-flow.md`

## 5. Completion Criteria
1:1 constraint and acceptance timeout enforced.
Single-technician constraint and explicit acceptance requirement are fully documented and isolated from future team-based concepts.
