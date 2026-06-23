# Request Domain WebSocket Architecture

## 1. Overview
The Request Domain relies on WebSockets to push real-time lifecycle updates from the backend Service Layer to connected clients. This avoids polling and provides immediate feedback for critical actions like quote approvals, technician assignments, and SLA breaches.

This implementation exclusively connects the Request Domain to the Django Channels layer. It is **not** a user-facing Notification Center (Phase 6), but rather a low-level Event Bridge for real-time frontend data synchronization.

## 2. Channels Infrastructure
*   **ASGI Application**: `config/asgi.py` handles the `ProtocolTypeRouter`.
*   **Auth Middleware**: `JWTAuthMiddlewareStack` intercepts connections, extracts the token, and attaches the `User` and `role_version` to the scope.
*   **Consumer Route**: `ws/requests/` maps to `RequestConsumer`.

## 3. Group Topology
Clients subscribe to Channels groups. The backend routes events to specific groups based on the event context and RBAC constraints.

| Group Name | Purpose | Authorized Roles |
| :--- | :--- | :--- |
| `request_{id}` | Real-time updates for a single Request. | Customer (Owner), Technician (Assigned), Staff, Manager, Superadmin |
| `customer_{id}`| Stream of all updates for a specific Customer. | Customer (Owner), Staff, Manager |
| `technician_{id}`| Stream of assignments/updates for a Technician.| Technician (Owner), Staff, Manager |
| `staff` | Global operations dashboard stream. | Staff |
| `manager` | Escalations, SLA alerts, global overrides. | Manager, Superadmin |

## 4. Security & Authorization

### Connection Authentication
Connections without a valid JWT are closed immediately with code `4001 (WS_CLOSE_AUTH_FAILED)`. Token expiration triggers `4002`.

### Group Subscription Isolation (RBAC)
When a client sends `{"action": "subscribe", "request_id": 101}`, the `RequestConsumer` evaluates `RBACChecker._is_authorized_for_request`.
*   **Customers** can only subscribe if `customer_id == self.user.id`.
*   **Technicians** can only subscribe if `assigned_technician_id == self.user.id`.
*   **Cross-user subscriptions** are blocked with `{"success": false, "error": "permission_denied"}`.

## 5. Domain Event Bridge
Services never call Channels directly. They emit standard `BaseEvent` objects via `DomainEventPublisher`. The `DomainEventPublisher` is integrated with the `WebSocketEventPublisher`, which intercepts the event, evaluates the routing rules, and pushes it to the Redis Channel Layer.

### Routing Rules

| Event Name | Target Groups |
| :--- | :--- |
| `request.created` | `request_{id}`, `customer_{id}` |
| `request.assigned` | `request_{id}`, `customer_{id}`, `technician_{id}` |
| `quote.created` | `request_{id}`, `customer_{id}` |
| `verification.submitted` | `request_{id}`, `staff` |
| `request.escalated` | `request_{id}`, `manager` |
| `sla.breach` | `manager` |
| *All other events* | `request_{id}` |

## 6. Canonical Payload Contract
All events broadcasted down the WebSocket follow a strict JSON contract reflecting the Domain Event:

```json
{
  "event": "request.assigned",
  "version": 1,
  "timestamp": "2026-06-07T12:00:00Z",
  "request_id": 101,
  "payload": {
    "technician_id": 42
  }
}
```

## 7. Client Usage Example
```javascript
const ws = new WebSocket('ws://localhost:8000/ws/requests/?token=JWT_TOKEN');

ws.onopen = () => {
    // Subscribe to a specific request stream
    ws.send(JSON.stringify({
        action: "subscribe",
        request_id: "101"
    }));
};

ws.onmessage = (message) => {
    const data = JSON.parse(message.data);
    if (data.event === "request.status_changed") {
        console.log("Status updated to:", data.payload.new_status);
    }
};
```
