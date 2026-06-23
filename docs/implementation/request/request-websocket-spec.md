# Request WebSocket Specification

## 1. File Purpose
Defines the real-time communication protocol for the Phase 3 Request system, providing instant updates to customers, technicians, and staff.

## 2. Scope
*   Channel naming conventions.
*   Authorization and security expectations.
*   Event mapping and payload structures.

## 3. Out of Scope
*   Technical Daphne/Channels configuration.
*   Frontend state management (e.g., Redux integration).

## 4. Full Content

### 4.1 Channel Naming
Channels must be granularly scoped to ensure data privacy:
*   `customer_{user_uuid}`: Private channel for customers to receive updates on owned requests.
*   `technician_{user_uuid}`: Private channel for technicians to receive new assignments and review results.
*   `staff_queue`: Shared channel for all Staff users to monitor incoming triage and assignments.
*   `manager_escalations`: Shared channel for Managers to monitor critical breaches and overrides.

### 4.2 Authorization Expectations
*   **Handshake**: JWT must be provided as a query parameter during the initial WebSocket handshake.
*   **Validation**: Middleware must verify the token and the user's role before permitting connection to shared channels (e.g., only `role == 'Manager'` can join `manager_escalations`).

### 4.3 Real-time Event Mapping

| Business Event | WebSocket Event | Target Channel |
| :--- | :--- | :--- |
| Request Submitted | `request.new_submission` | `staff_queue` |
| Assigned to Tech | `request.assigned` | `technician_{uuid}` |
| Quote Issued | `request.quote_received` | `customer_{uuid}` |
| Verification Result| `request.verification_result`| `technician_{uuid}` |
| SLA Breach | `request.sla_breach` | `manager_escalations` |

### 4.4 Event Payload Structure
All real-time events must follow a standardized envelope:
```json
{
  "event": "string",
  "request_id": "UUID",
  "timestamp": "ISO8601",
  "data": {
    "status": "string",
    "message": "string",
    "payload": { ... }
  }
}
```

### 4.5 Delivery & Retry
*   **Broadcast Strategy**: Reliable delivery is not guaranteed for real-time hints. The REST API remains the source of truth.
*   **Reconnection**: Clients must perform a full state refresh from the REST API upon WebSocket reconnection.
