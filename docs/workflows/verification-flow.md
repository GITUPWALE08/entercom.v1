# Verification Flow Workflow

## 1. Purpose
Defines the quality assurance gates required before a request can transition to a terminal `completed` state. It ensures accountability and standardizes the collection of proof-of-work.

## 2. Scope
- Category-specific verification requirements.
- Mandatory evidence collection rules.
- Review authority and rework paths.

## 3. Out of Scope
- Automated AI-based image verification.
- Customer satisfaction surveys (post-completion).

## 4. Definitions
*   Refer to `docs/architecture/request/domain-glossary.md`.

## 5. Rules
*   **Authority**: Verification review is performed by Staff. Managers hold override authority.
*   **Failure Consequence**: A failed verification instantly returns the request from `pending_verification` back to `in_progress` for rework.
*   **Repeated Failures**: Multiple verification failures on the same request trigger manager escalation.
*   **Immutability**: Once verification is approved and the request is `completed`, the evidence becomes immutable. Only a Manager override can append post-completion (must be heavily audited).
*   **Fail-Closed**: If evidence uploads fail or validators error out, the request cannot advance and remains in `pending_verification`.

## 6. Required Matrices/Tables

### Verification Requirement Matrix
| Category | Requirement Level | Allowed Evidence |
| :--- | :--- | :--- |
| `installation` | Mandatory | Photos, Signed Checklist, Customer ACK, Geo/Timestamp Metadata |
| `maintenance` | Mandatory | Applicable evidence types |
| `inspection` | Optional | Applicable evidence types |
| `support` | None | N/A |
| `information` | None | N/A |
| `product_order` | None | N/A |

*(Other categories follow standard business defaults or skip verification).*

## 7. Edge Cases
*   **Missing Metadata**: If geo/timestamp metadata is stripped from photos due to device settings, the verification must fail-closed and await staff review/override.

## 8. Audit Expectations
Must log:
*   `actor`, `action`, `timestamp`, `correlation_id`, `request_id`, `previous_state`, `new_state`.
*   `reason`: Mandatory if verification is rejected, or if a Manager overrides a failure.

## 9. Dependencies
- docs/workflows/reason-codes.md
*   `docs/workflows/request-lifecycle.md` (Gate logic).

## 10. Completion Criteria
Evidence prerequisites and failure loops are explicitly mapped.

## 11. Open Questions
*   UNRESOLVED — BUSINESS DECISION REQUIRED (What is the exact threshold number of repeated verification failures that triggers manager escalation?)- Ans: three