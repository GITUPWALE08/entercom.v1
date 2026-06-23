# Request Notification Triggers

## 1. Purpose
This document defines the system-level triggers that initiate notifications to customers, staff, and technicians throughout the Request Lifecycle. It ensures all actors are informed of critical state changes and required actions.

## 2. Scope
- Triggers for lifecycle, quote, assignment, verification, escalation, and SLA notifications.
- Recipient mapping and priority level assignment.
- Channel eligibility (WebSocket, Email, Push).

## 3. Out of Scope
- Notification template design or copy (the "what" is defined here, the "how it looks" is not).
- Granular WebSocket message schemas.
- Notification retry or failure handling logic.

## 4. Definitions
- **Priority**: Indicates the urgency of the notification (Critical, High, Medium, Low).
- **Channel Eligibility**: Specifies which delivery methods are permitted for a specific trigger.

## 5. Detailed Notification Sections

### 5.1 Request Lifecycle Notifications
| Trigger | Recipient | Priority | Channels |
| :--- | :--- | :--- | :--- |
| Request Submitted | Customer | Low | Email, Push |
| Request Received | Staff | Medium | WebSocket |
| Request Completed | Customer | Medium | Email, Push |
| Request Cancelled | Customer / Tech | High | WebSocket, Email, Push |

### 5.2 Quote Notifications
| Trigger | Recipient | Priority | Channels |
| :--- | :--- | :--- | :--- |
| Quote Issued | Customer | High | WebSocket, Email, Push |
| Quote Approved | Staff / Tech | Medium | WebSocket, Email |
| Quote Revision Req | Staff / Tech | Medium | WebSocket |
| Quote Expired | Customer / Staff | Medium | Email |

### 5.3 Assignment Notifications
| Trigger | Recipient | Priority | Channels |
| :--- | :--- | :--- | :--- |
| Technician Assigned | Technician | High | WebSocket, Push |
| Assignment Timeout | Staff | High | WebSocket |
| Assignment Accepted | Staff / Customer | Medium | WebSocket, Email |
| Assignment Declined | Staff | High | WebSocket |

### 5.4 Verification Notifications
| Trigger | Recipient | Priority | Channels |
| :--- | :--- | :--- | :--- |
| Verification Req | Staff | Medium | WebSocket |
| Verification Approved | Customer / Tech | Medium | WebSocket, Email, Push |
| Verification Rejected | Technician | High | WebSocket, Push |
| Verification Override | Staff / Tech | High | WebSocket, Email |

### 5.5 Escalation Notifications
| Trigger | Recipient | Priority | Channels |
| :--- | :--- | :--- | :--- |
| Escalation Triggered | Manager | Critical | WebSocket, Email, Push |
| SLA Breach Detected | Manager | Critical | WebSocket, Email |
| SLA Warning (80%) | Staff | High | WebSocket |

## 6. Dependencies
- **docs/workflows/notification-trigger-matrix.md**: High-level matrix reference.
- **docs/architecture/request/request-events.md**: These triggers are primarily derived from domain events.

## 7. Open Questions
- **Staff Duty Hours**: UNRESOLVED — BUSINESS DECISION REQUIRED (Should notifications to Staff be suppressed or queued outside of working hours for non-critical priorities?)

## 8. Completion Criteria
- Triggers cover every critical state transition and gate in Phase 3.
- Recipient and Channel mappings align with business priorities.
- Critical escalations and breaches are assigned universal channel eligibility for maximum visibility.
