# Request Domain Events

## 1. Purpose
This document defines the canonical domain events produced within the Request Lifecycle System (Phase 3). These events facilitate decoupled communication between services, trigger asynchronous workflows, and provide a rich audit trail for system behavior.

## 2. Scope
- Definition of event types categorized by domain service.
- Triggers, producers, and potential consumers.
- Mandatory payload requirements for each event.
- Correlation requirements for tracing.

## 3. Out of Scope
- Technical message broker implementation (e.g., Celery, Redis).
- Specific WebSocket message payload formats for frontend real-time updates.
- External integration event schemas.

## 4. Definitions
- **Producer**: The service responsible for detecting a state change and emitting the event.
- **Consumer**: A system component or service that listens for an event to trigger a secondary action (e.g., NotificationService).
- **Correlation ID**: A unique identifier that links multiple events originating from the same high-level business transaction.

## 5. Detailed Event Sections

### 5.1 Request Events
| Event Name | Trigger | Producer | Payload Fields | Audit Req |
| :--- | :--- | :--- | :--- | :--- |
| `request.created` | Draft saved | `RequestService` | `request_id`, `customer_id`, `category` | No |
| `request.submitted`| Draft submitted | `RequestService` | `request_id`, `priority`, `category` | Yes |
| `request.status_changed` | Lifecycle transition | `RequestService` | `request_id`, `prev_status`, `new_status`| Yes |
| `request.cancelled` | Valid cancellation | `RequestService` | `request_id`, `actor_id`, `reason_code`| Yes |

### 5.2 Quote Events
| Event Name | Trigger | Producer | Payload Fields | Audit Req |
| :--- | :--- | :--- | :--- | :--- |
| `quote.created` | New quote version | `QuoteService` | `quote_id`, `version`, `amount` | Yes |
| `quote.approved` | Customer accepts | `QuoteService` | `quote_id`, `request_id`, `customer_id` | Yes |
| `quote.rejected` | Customer declines | `QuoteService` | `quote_id`, `reason_code` | Yes |
| `quote.revision_requested`| Customer requests change | `QuoteService` | `quote_id`, `revision_notes` | Yes |
| `quote.expired` | 30 days elapsed or revision limit exceeded | `QuoteService` | `quote_id`, `request_id` | Yes |

### 5.3 Assignment Events
| Event Name | Trigger | Producer | Payload Fields | Audit Req |
| :--- | :--- | :--- | :--- | :--- |
| `request.assigned` | Staff assigns tech | `AssignmentService`| `request_id`, `technician_id` | Yes |
| `assignment.accepted`| Tech accepts | `AssignmentService`| `request_id`, `technician_id`, `timestamp`| Yes |
| `assignment.declined`| Tech declines | `AssignmentService`| `request_id`, `reason_code` | Yes |
| `assignment.timeout` | 48h no response | `AssignmentService`| `request_id`, `technician_id` | Yes |

### 5.4 Verification Events
| Event Name | Trigger | Producer | Payload Fields | Audit Req |
| :--- | :--- | :--- | :--- | :--- |
| `verification.submitted` | Tech finishes work | `VerificationService`| `request_id`, `evidence_links` | Yes |
| `verification.approved` | QA review passes | `VerificationService`| `request_id`, `staff_id` | Yes |
| `verification.rejected` | QA review fails | `VerificationService`| `request_id`, `rework_notes` | Yes |
| `verification.overridden`| Manager bypass | `VerificationService`| `request_id`, `manager_id`, `reason` | Yes |

### 5.5 Escalation Events
| Event Name | Trigger | Producer | Payload Fields | Audit Req |
| :--- | :--- | :--- | :--- | :--- |
| `escalation.triggered` | Trigger hit | `EscalationService`| `request_id`, `trigger_type` | Yes |
| `escalation.resolved` | Manager resolution | `EscalationService`| `request_id`, `resolution_type` | Yes |

### 5.6 SLA Events
| Event Name | Trigger | Producer | Payload Fields | Audit Req |
| :--- | :--- | :--- | :--- | :--- |
| `sla.warning` | 80% of target reached| `SLAService` | `request_id`, `priority`, `time_left` | No |
| `sla.breached` | Target exceeded | `SLAService` | `request_id`, `priority`, `delay` | Yes |

## 6. Dependencies
- **docs/architecture/request/request-services.md**: Defines the producers of these events.
- **docs/workflows/reason-codes.md**: Standardized codes for payload fields.

## 7. Open Questions
- **Event Persistence Policy**: UNRESOLVED — BUSINESS DECISION REQUIRED (How long must domain event records be persisted for forensic analysis vs. operational throughput?)

## 8. Completion Criteria
- Events cover all primary state changes and business milestones in Phase 3.
- All payload fields include the mandatory `correlation_id` and `request_id`.
- Audit requirements are explicitly identified for high-risk events.
