# Request WebSocket Specification

## 1. File Purpose
Defines the real-time event distribution layer for the Request system.

## 2. Scope
*   Channels/Groups definition.
*   Real-time event payload shapes.
*   Authorization and delivery guarantees.

## 3. Out of Scope
- Socket connection technical handshake (Daphne/Channels config).
- Notification Service implementation.

## 4. Full Content

### 4.1 Channels & Grouping
Real-time updates must be granularly scoped to prevent data leakage:
*   `customer_{id}`: Exclusive updates for owned requests.
*   `technician_{id}`: Updates for assigned work only.
*   `staff_queue`: Global stream for triage and dispatchers.
*   `manager_escalations`: Exclusive stream for managerial intervention.

### 4.2 Event Payload Shapes
All WebSocket messages must follow the format:
```json
{
  "event": "canonical_name",
  "request_id": "UUID",
  "timestamp": "ISO8601",
  "data": { ... }
}
```

#### Example: `assignment.new`
*   **Target**: `technician_{id}`.
*   **Data**: `{category, location_summary, priority}`.

#### Example: `request.status_changed`
*   **Target**: `customer_{id}` and `staff_queue`.
*   **Data**: `{new_status, actor_type}`.

### 4.3 Authorization Requirements
*   A valid JWT must be provided at the socket connection handshake.
*   Middleware must bind the authenticated `User` object to the socket scope.
*   Server-side validation must occur before adding a connection to a sensitive group (e.g., `manager_escalations`).

### 4.4 Delivery Expectations
*   **Best Effort**: Updates are real-time but not for state synchronization. Clients must use REST API for the source of truth upon socket reconnection.
*   **Retry Behavior**: Automatic client-side reconnect with exponential backoff.
