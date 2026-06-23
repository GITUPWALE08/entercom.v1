# Request Lifecycle System: Test Strategy

## 1. Purpose

The purpose of this document is to define the authoritative testing strategy and requirements for the Phase 3 Request Lifecycle System. It establishes what must be tested, why it must be tested, and the expected coverage and acceptance criteria to ensure the implementation strictly adheres to the approved business and architectural rules.

## 2. Scope

This strategy covers all automated testing requirements for the Request Lifecycle System, including:
*   Domain Model behavior and invariants.
*   State Machine transitions, constraints, and lifecycle logic.
*   Service-layer orchestration (Requests, Quotes, Assignments, Verifications, Escalations, SLAs).
*   Role-Based Access Control (RBAC) permission enforcement.
*   Background job idempotency and scheduling logic.
*   Domain event generation and payload compliance.
*   REST API endpoint validation and authorization.
*   Forensic audit record generation and immutability.

## 3. Out of Scope

*   Frontend/UI testing strategies.
*   Testing of payment gateway integrations (mocks/stubs should be used).
*   Performance and load testing infrastructure setups.
*   Writing actual test implementation code or defining test database schemas.
*   Test framework configuration (e.g., `pytest.ini` setups).

## 4. Testing Principles

*   **Fail-Closed Verification**: Tests must explicitly verify that workflows halt and state remains unchanged when gates (payment, verification, permissions) are not met.
*   **Auditability as a Feature**: Every test modifying state must assert the successful and correct generation of an immutable audit log.
*   **State Machine Exhaustiveness**: The test suite must exercise every allowed transition and explicitly attempt (and expect failure for) invalid transitions.
*   **Mocking Externalities**: External systems (e.g., Notification delivery, external payment processors) must be stubbed to ensure tests remain deterministic and domain-focused.

## 5. Test Pyramid Strategy

*   **Unit Tests**: Focus on isolated business logic. Examples: SLA deadline calculators, permission matrix evaluation, quote expiry calculation, state transition guard conditions.
*   **Integration Tests**: Focus on Service-layer orchestration and database persistence. Examples: Request creation spanning parent-child inheritance, Assignment limits, Verification evidence aggregation.
*   **API / E2E Domain Tests**: Focus on the REST API layer, ensuring HTTP payloads correctly route through middleware, permissions, services, and result in correct Database and Event emission states.

## 6. Model Test Requirements

Database models must enforce structural integrity and domain constraints before service logic applies.

*   **Request Tests**: Verify aggregate root creation, mandatory fields (`customer`, `category`, `status`, `priority`, `created_at`), and default configurations. Verify that `device_outage` defaults to `emergency` priority.
*   **Parent-Child Tests**: Verify that child requests successfully inherit `customer`, `location`, and `uploaded evidence` from the parent, while ensuring `priority` is not automatically inherited. Preserve lineage checks.
*   **Quote Tests**: Verify generation rules, 30-day expiration calculations, max 3 revision threshold limits, and status constraints.
*   **Assignment Tests**: Verify exactly 1:1 technician mapping constraint. Verify tracking of `decline_count` and timeout thresholds (48 hours).
*   **Verification Tests**: Verify required evidence payloads (`photos`, `signed checklist`, `customer acknowledgement`, `geo metadata`, `timestamp metadata`) are structurally validated.
*   **Audit Tests**: Verify immutable constraints at the ORM/DB level. Attempting to update or delete an audit record must raise a database or ORM integrity error.

## 7. Permission Test Requirements

RBAC permissions must be tested across all roles to ensure strict operational boundaries. Tests must assert both granted access (HTTP 200/201) and denied access (HTTP 403).

### Role Matrix Testing Requirements

| Action | Customer | Technician | Staff | Manager |
| :--- | :--- | :--- | :--- | :--- |
| **view** | Owned requests | Assigned requests | Global | Global |
| **edit** | Pre-assignment (draft/submitted) | Assigned (in_progress) | Global | Global |
| **assign** | DENY | DENY | Global | Global |
| **verify** | DENY | DENY | Global | Global (Override) |
| **quote** | Approve/Reject/Revise (Owned) | Create (Assigned) | Create/Revise | Create/Revise |
| **escalate** | DENY | DENY | Global (Manual) | Global |
| **cancel** | Pre-assignment | DENY | Pre-assignment | Global |

*Note: Tests must explicitly verify that Staff cannot cancel an assigned request without Manager approval.*

## 8. State Machine Test Requirements

The lifecycle state machine must be exhaustively tested to prevent illegal transitions.

*   **States to Cover**: `draft`, `submitted`, `staff_review`, `awaiting_quote`, `awaiting_customer_approval`, `awaiting_payment`, `awaiting_assignment`, `assigned`, `in_progress`, `pending_verification`, `completed`, `escalated`, `cancelled`.
*   **Valid Transition Tests**: Execute tests verifying successful movement along the happy path for all 10 categories, acknowledging skipped states (e.g., `information` skipping `awaiting_quote` and `assigned`).
*   **Invalid Transition Tests**: Assert that moving backward improperly (e.g., `completed` to `in_progress`) or bypassing states (e.g., `draft` to `completed`) throws appropriate state transition exceptions.
*   **Gate Validation Tests**:
    *   Verify `awaiting_payment` blocks `awaiting_assignment` until payment is cleared.
    *   Verify `pending_verification` blocks `completed` until evidence is approved.
    *   Verify `awaiting_quote` blocks transition until quote is generated.

## 9. Quote Flow Test Requirements

Must verify financial and approval lifecycle boundaries.

*   **Quote Creation**: Verify technicians or staff can generate quotes. Verify inspection mandatory booking precedes quoting.
*   **Quote Approval/Rejection**: Verify customer state changes trigger appropriate downstream transitions (e.g., approval moves to `awaiting_payment` or `awaiting_assignment`).
*   **Quote Revision & Limits**: Verify customers can request revisions. Verify the 3-revision maximum. Verify that attempting a 4th revision triggers expiration.
*   **Quote Expiry & Auto-Cancellation**: Verify 30-day expiry automatically triggers request cancellation.
*   **Override Rules**: Verify only staff/managers can revise another technician's quote.

## 10. Assignment Test Requirements

Must verify strict 1:1 assignment and escalation thresholds.

*   **Assignment**: Verify successful 1:1 binding of tech to request. Ensure team assignments are explicitly blocked.
*   **Acceptance**: Verify technician explicit acceptance transitions request to `in_progress`.
*   **Decline**: Verify technician decline increments `decline_count`, requires a mandatory reason, and does *not* create a separate lifecycle state. Verify technical declines trigger reassignment workflows, while non-technical declines trigger escalation.
*   **Timeout**: Verify 48-hour assignment timeout registers as a decline and increments the counter.
*   **Escalation**: Verify exactly 3 cumulative declines/timeouts instantly transitions the request to `escalated` and routes to a manager.

## 11. Verification Test Requirements

Must verify Quality Assurance gates.

*   **Matrix Validation**: 
    *   Verify `installation` and `maintenance` block completion without verification.
    *   Verify `inspection` allows but does not strictly require verification.
    *   Verify `support`, `information`, `product_order` bypass verification entirely.
*   **Evidence Validation**: Assert submission fails if missing `photos`, `signed checklist`, `customer acknowledgement`, `geo metadata`, or `timestamp metadata` (for mandatory categories).
*   **Approval/Rejection**: Verify staff approval transitions to `completed`. Verify staff rejection transitions to `in_progress` (Rework Loop).
*   **Rework Loop**: Verify repeated failures correctly route to `escalated` for manager review.
*   **Overrides**: Verify managers can bypass failed verifications. Verify evidence becomes immutable post-approval (except via manager override).

## 12. Payment Gate Test Requirements

Must verify financial barriers to dispatch.

*   **Payment-Required Categories**: Assert `installation`, `maintenance`, and `product_order` cannot enter `awaiting_assignment` without full payment confirmation.
*   **Non-Payment Categories**: Assert `support`, `information`, and `booking` bypass the `awaiting_payment` state entirely.
*   **Inspection Exception**: Verify `inspection` requests require no payment.
*   **Device Outage Exception**: Verify `device_outage` permits payment *after* diagnosis (bypasses pre-assignment gate).
*   **Blocking Mechanisms**: Assert that partial payments do not clear the payment gate (MVP rule: full payment only).

## 13. SLA Test Requirements

Must verify tracking and breach detection.

*   **SLA Timers**: Assert timers start correctly at submission based on priority limits:
    *   Emergency (< 24 hours)
    *   Urgent (< 3 working days)
    *   Normal (< 5 working days)
    *   Low (< 7 working days)
*   **Device Outage**: Verify all `device_outage` requests are forced to `emergency` priority and routed to the distinct emergency queue without bypassing standard queue validation.
*   **SLA Breaches**: Assert breaches trigger manager notifications and automatic priority escalation.

## 14. Background Job Test Requirements

Tests must verify Celery/background task scheduling, execution, and idempotency.

*   **SLA Monitoring Jobs**: Verify job accurately queries near-breach and breached requests, triggering events without duplicating logs on repeated runs.
*   **Quote Expiry Jobs**: Verify job sweeps 30-day old quotes, transitions quote to expired, and transitions parent request to `cancelled`.
*   **Assignment Timeout Jobs**: Verify job detects 48-hour stale assignments, revokes assignment, increments decline counter, and logs timeout event.
*   **Escalation Jobs**: Verify job cleanly transfers ownership to manager and fires notification triggers.

## 15. Event Test Requirements

Must verify domain event generation and structure.

*   **Producer Validation**: Assert that lifecycle transitions (e.g., via API or Service) successfully emit the defined canonical events: `request.created`, `request.submitted`, `request.assigned`, `assignment.accepted`, `request.status_changed`, `request.cancelled`, `quote.created`, `quote.approved`, `verification.approved`, etc.
*   **Payload Validation**: Assert event payloads conform to expected schemas (containing state changes, timestamps, and metadata).
*   **Audit Correlation**: Assert every emitted event includes a `correlation_id` and `request_id` mapping back to the transaction.

## 16. API Test Requirements

Must verify the REST interface contracts.

*   **Authentication & Authorization**: Verify endpoints reject unauthenticated requests (401) and unauthorized roles (403).
*   **Validation**: Verify malformed requests (e.g., missing decline reason, missing evidence fields) return 400/422 responses.
*   **Lifecycle Effects**: Verify HTTP POSTs to semantic endpoints (e.g., `/api/v1/requests/{id}/assign`) correctly invoke the Service layer and return the updated state representation.

## 17. Audit Test Requirements

Must verify forensic traceability.

*   **Audit Creation**: Assert every state transition, assignment, verification, override, escalation, quote action, and cancellation natively writes a record.
*   **Mandatory Fields**: Assert records strictly contain `actor`, `action`, `timestamp`, `correlation_id`, `request_id`, `previous_state`, `new_state`, and `reason` (where applicable).
*   **Immutable Audit Records**: Verify tests explicitly fail if audit records are tampered with (via database raw updates in test environments).

## 18. Test Coverage Targets

*   **Domain Services**: 100% line and branch coverage required for all Request, Quote, Assignment, Verification, SLA, and Escalation services.
*   **State Machine Transitions**: 100% coverage of all valid and explicitly invalid transitions.
*   **API Endpoints**: 90%+ coverage, encompassing at least one happy path and all distinct permission/validation failure paths.
*   **Background Tasks**: 100% coverage for idempotency and side-effects.

## 19. Acceptance Criteria

*   All test suites run deterministically in CI/CD environments without race conditions.
*   No tests rely on direct Database mutation for state advancement (must use Service layer).
*   Every defined business rule in this strategy document has at least one corresponding automated test.
*   All mocked externalities (Gateways, Notifications) are asserted for correct payload passing.

## 20. Exit Criteria

*   Coverage reports meet or exceed targets defined in Section 18.
*   Test suite execution time is optimized to prevent CI pipeline bottlenecks.
*   The Strategy document is fully realized in the codebase, with zero missing validations for Phase 3 requirements.
*   Security and Audit tests prove the system is completely fail-closed.
