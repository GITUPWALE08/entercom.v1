# Request Event Contracts

## 1. File Purpose
Defines the schema-less contracts for domain events produced by the Request system.

## 2. Scope
*   Event names and triggers.
*   Producer/Consumer relationships.
*   Mandatory payload structures for downstream services.

## 3. Out of Scope
*   Message broker technical configuration.
*   WebSocket data shapes.

## 4. Full Content

### 4.1 Lifecycle Events
* Consumers is defined here because it's the implementation and we have to be explicit, in the architecture we just need to define the producer.

| Event Name | Producer | Consumers | Audit |
| :--- | :--- | :--- | :--- |
| `request.created` | RequestService | None (Log only) | No |
| `request.submitted`| RequestService | SLAService, NotifService | Yes |
| `request.assigned` | AssignmentService | SLAService, NotifService | Yes |
| `assignment.accepted` | AssignmentService | SLAService, NotifService | Yes |
| `request.status_changed`| RequestService | Archiver, NotifService | Yes |
| `request.cancelled`| RequestService | SLAService, NotifService | Yes |

### 4.2 Quote Events

| Event Name | Producer | Consumers | Payload Requirements |
| :--- | :--- | :--- | :--- |
| `quote.created` | QuoteService | NotifService | `{version, amount}` |
| `quote.approved` | QuoteService | RequestService, NotifService | `{quote_id, request_id, customer_id}` |
| `quote.rejected` | QuoteService | RequestService, NotifService | `{reason_code}` |

### 4.3 Operational Events

| Event Name | Trigger | Audit Impact |
| :--- | :--- | :--- |
| `verification.approved` | Manager/Staff approval | Closes forensic Work Log |
| `verification.rejected` | Staff rejection | Triggers Rework Audit |
| `escalation.triggered`| 3 declines / SLA breach | High-Risk incident created |

### 4.4 Payload Structure Template
Every event MUST include:
*   `event_id`: Unique UUID for the event record.
*   `request_id`: Primary Request reference.
*   `correlation_id`: Link to the trace chain.
*   `timestamp`: Event emission time.
*   `actor_id`: User/system identity responsible.
*   `data`: JSON object with specific attributes (see tables above).
 above).
