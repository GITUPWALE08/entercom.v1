# Purpose
To define the future integration points and realtime boundaries for the Order Domain, enabling asynchronous WebSocket delivery in Phase 6 without coupling the domain logic to the transport layer.

# Scope
* Documenting WebSocket integration hooks for the Order Domain.
* Realtime delivery mapping for `order.created` and `order.fulfilled` events.
* Defining security, payload ownership, and correlation preservation rules for future consumers.

# Out Of Scope
* Django Channels implementation.
* Redis configuration.
* WebSocket consumers, groups, or connection managers.
* Subscription logic.
* Defining new websocket-specific payload schemas.
* Emitting any new events beyond approved domain events.

# Realtime Ownership
The Order Domain owns the production of the core domain events. The future Realtime/Notification Domain (Phase 6) will own the consumption, broadcasting, and delivery of these events to connected WebSocket clients.

# Future Event Hooks

## 1. order.created
* **Event Name:** `order.created`
* **Source Event Contract:** Defined in `docs/implementation/order/order-event-contracts.md`
* **Producer:** `OrderService.create_order`
* **Trigger:** Customer checks out and successfully creates a new order.
* **Future Consumers:** Phase 6 WebSocket Broadcaster (Notifying customer UI, staff dashboards).
* **Correlation Requirements:** Must preserve the exact `correlation_id` generated during the request and embedded in the original domain event.

## 2. order.fulfilled
* **Event Name:** `order.fulfilled`
* **Source Event Contract:** Defined in `docs/implementation/order/order-event-contracts.md`
* **Producer:** `OrderService.fulfill_order`
* **Trigger:** Staff marks the order as fulfilled.
* **Future Consumers:** Phase 6 WebSocket Broadcaster (Notifying customer UI of order readiness).
* **Correlation Requirements:** Must preserve the exact `correlation_id` from the original domain event.

# Event Source Mapping
All realtime events MUST originate from approved domain events published via the central `event_publisher`. The WebSocket layer MUST NOT create events, intercept direct service calls, or bypass the event bus.

# Payload Source Rules
The WebSocket layer is a passive consumer only. It MUST NOT mutate state or alter payloads. Payload structures, constraints, and versioning ownership remain strictly defined within `docs/implementation/order/order-event-contracts.md`. No separate websocket-specific payload schemas will be defined.

# Correlation Rules
Realtime delivery MUST strictly preserve the `correlation_id` from the originating domain event. The WebSocket layer is forbidden from generating new correlation IDs for broadcasted messages.

# Security Considerations
* **Customer isolation required:** Events containing customer data must be broadcast strictly to authorized private channels.
* **IDOR protection required:** Consumers must verify ownership before relaying payloads to WebSocket clients.
* **Authorization required:** Connections must be authenticated.
* **Event visibility follows permission mappings:** Follows strict permission rules (e.g., Staff can see all `order.created` events, Customers can only see their own).

# Phase Boundaries
* **Phase 5:** Documents hooks. No infrastructure or transport code is implemented.
* **Phase 6:** Implements realtime delivery (Channels, Redis, Consumers).

# Open Questions
* UNRESOLVED — BUSINESS DECISION REQUIRED (Specific channel naming conventions).
* UNRESOLVED — BUSINESS DECISION REQUIRED (Client reconnection and missed event recovery strategies).

# Completion Criteria
* Documentation of all required hooks is finalized.
* Review by Phase 6 implementation team.
