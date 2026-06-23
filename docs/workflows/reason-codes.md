# Reason Codes

## 1. Purpose
This document provides the canonical source of truth for reason codes used throughout the Request domain. These codes ensure consistent auditing, reporting, and programmatic handling of lifecycle exceptions and decisions.

## 2. Design Principles
*   **Immutable**: Codes are permanent once published to maintain historical audit integrity.
*   **Audit-Safe**: Codes are designed to be stored in long-term audit logs and event streams.
*   **Programmatic Usage**: Codes are used in API responses, system events, and administrative actions to trigger specific logic.
*   **Supplemental Feedback**: Free-text explanations provided by actors are considered supplemental and do not replace the mandatory canonical reason code.

## 3. Cancellation Reason Codes
| Code | Description | Actor Allowed |
| :--- | :--- | :--- |
| `CUSTOMER_NO_LONGER_INTERESTED` | Customer decided not to proceed with the service. | Customer, Staff, Manager |
| `CUSTOMER_CREATED_IN_ERROR` | Request was created accidentally or with incorrect data. | Customer, Staff, Manager |
| `CUSTOMER_REQUEST_CHANGED` | Requirements changed significantly requiring a new request. | Customer, Staff, Manager |
| `PAYMENT_NOT_COMPLETED` | Mandatory payment gate was not cleared within the allowed window. | System |
| `QUOTE_EXPIRED` | Customer failed to act on the quote within the 30-day validity period. | System |
| `QUOTE_REVISION_LIMIT_EXCEEDED` | Request exceeded the maximum of 3 allowed revisions. | System |
| `STAFF_CANCELLED_DUPLICATE` | Request is a duplicate of an existing active request. | Staff, Manager |
| `STAFF_CANCELLED_INVALID_REQUEST` | Request details are invalid or cannot be fulfilled. | Staff, Manager |
| `MANAGER_CANCELLED_POLICY_VIOLATION` | Request violates internal company or safety policies. | Manager |

## 4. Assignment Decline Reason Codes
| Code | Description | Actor Allowed |
| :--- | :--- | :--- |
| `TECHNICIAN_UNAVAILABLE` | Technician is not available during the requested window. | Technician |
| `TECHNICIAN_OUT_OF_REGION` | Request location is outside the technician's service area. | Technician |
| `TECHNICIAN_SKILL_MISMATCH` | Request requires skills or certifications the technician lacks. | Technician |
| `TECHNICIAN_WORKLOAD_CAPACITY` | Technician has reached their maximum daily or weekly capacity. | Technician |
| `TECHNICIAN_PERSONAL_EMERGENCY` | Unforeseen personal circumstances preventing attendance. | Technician |

## 5. Escalation Reason Codes
| Code | Description | Actor Allowed |
| :--- | :--- | :--- |
| `THREE_DECLINES_THRESHOLD` | Request has been declined or timed out by 3 cumulative technicians. | System |
| `SLA_BREACH` | Request has exceeded its initial response target. | System |
| `EMERGENCY_DEVICE_OUTAGE` | Automated escalation for critical hardware failure. | System |
| `MANUAL_MANAGER_REVIEW` | Staff or Technician requested immediate managerial oversight. | Staff, Technician |
| `REPEATED_VERIFICATION_FAILURE` | Work has failed quality assurance checks multiple times. | System, Staff |

## 6. Verification Failure Reason Codes
| Code | Description | Actor Allowed |
| :--- | :--- | :--- |
| `MISSING_EVIDENCE` | Required photos or documentation were not uploaded. | Staff, Manager |
| `INVALID_EVIDENCE` | Uploaded evidence does not show the work performed or is poor quality. | Staff, Manager |
| `CHECKLIST_INCOMPLETE` | The mandatory technician checklist was not fully satisfied. | Staff, Manager |
| `CUSTOMER_ACKNOWLEDGEMENT_MISSING`| Required customer signature or acknowledgement is absent. | Staff, Manager |
| `QUALITY_STANDARD_FAILED` | Physical work does not meet Entercom Security quality standards. | Staff, Manager |

## 7. Quote Rejection Reason Codes
| Code | Description | Actor Allowed |
| :--- | :--- | :--- |
| `PRICE_TOO_HIGH` | Customer found the estimated cost unacceptable. | Customer |
| `SCOPE_NOT_ACCEPTABLE` | Customer disagrees with the proposed range of work. | Customer |
| `REQUEST_REVISION` | Customer requested changes to line items or terms. | Customer |
| `COMPETITOR_OPTION_SELECTED` | Customer chose a different service provider. | Customer |
| `PROJECT_POSTPONED` | Customer decided to delay the project indefinitely. | Customer |

## 8. Usage Rules
Reason codes must be:
1.  **Stored in Audit Logs**: Every state transition requiring a reason must persist the canonical code.
2.  **Included in Events**: Domain events (e.g., `request.cancelled`) must include the code in the payload.
3.  **Included in API Responses**: Clients must receive the code to display appropriate localized messages.
4.  **Included in Managerial Reports**: Operational analytics will be driven by these canonical identifiers.
