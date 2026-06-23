# Purpose
To define the future integration points and realtime boundaries for the Payment Domain, enabling asynchronous WebSocket delivery in Phase 6 without coupling the financial domain logic to the transport layer.

# Scope
* Documenting WebSocket integration hooks for the Payment Domain.
* Realtime delivery mapping for `payment.paid` and `payment.failed` events.
* Defining security, payload ownership, and correlation preservation rules for future consumers.

# Out Of Scope
* Django Channels implementation.
* Redis configuration.
* WebSocket consumers, groups, or connection managers.
* Subscription logic.
* Defining new websocket-specific payload schemas.
* Emitting any new events beyond approved domain events.

# Realtime Ownership
The Payment Domain owns the production of the core domain events. The future Realtime/Notification Domain (Phase 6) will own the consumption, broadcasting, and delivery of these events to connected WebSocket clients.

# Future Event Hooks

## 1. payment.paid
* **Event Name:** `payment.paid`
* **Source Event Contract:** Defined in `docs/implementation/payment/payment-event-contracts.md`
* **Producer:** `WebhookService.process_webhook` (or related payment processing workflows).
* **Trigger:** Payment provider successfully confirms the charge.
* **Future Consumers:** Phase 6 WebSocket Broadcaster (Notifying customer checkout UI of successful payment).
* **Correlation Requirements:** Must preserve the exact `correlation_id` embedded in the originating domain event.

## 2. payment.failed
* **Event Name:** `payment.failed`
* **Source Event Contract:** Defined in `docs/implementation/payment/payment-event-contracts.md`
* **Producer:** `WebhookService.process_webhook` (or related payment processing workflows).
* **Trigger:** Payment provider reports a failed charge.
* **Future Consumers:** Phase 6 WebSocket Broadcaster (Notifying customer checkout UI of failure to allow retry).
* **Correlation Requirements:** Must preserve the exact `correlation_id` embedded in the originating domain event.

# Event Source Mapping
All realtime events MUST originate from approved domain events published via the central `event_publisher`. The WebSocket layer MUST NOT create events, intercept direct service calls, or bypass the event bus.

# Payload Source Rules
The WebSocket layer is a passive consumer only. It MUST NOT mutate state or alter payloads. Payload structures, constraints, and versioning ownership remain strictly defined within `docs/implementation/payment/payment-event-contracts.md`. No separate websocket-specific payload schemas will be defined.

# Correlation Rules
Realtime delivery MUST strictly preserve the `correlation_id` from the originating domain event. The WebSocket layer is forbidden from generating new correlation IDs for broadcasted messages.

# Security Considerations
* **Customer isolation required:** Financial events must be broadcast strictly to authorized private channels.
* **IDOR protection required:** Consumers must verify ownership of the payment/order before relaying payloads to WebSocket clients.
* **Authorization required:** Connections must be authenticated.
* **Event visibility follows permission mappings:** Follows strict permission mappings. No global broadcast of financial data is allowed.

# Phase Boundaries
* **Phase 5:** Documents hooks. No infrastructure or transport code is implemented.
* **Phase 6:** Implements realtime delivery (Channels, Redis, Consumers).

# Open Questions
* UNRESOLVED — BUSINESS DECISION REQUIRED (Specific channel naming conventions).
* UNRESOLVED — BUSINESS DECISION REQUIRED (Client reconnection and missed event recovery strategies).

# Completion Criteria
* Documentation of all required hooks is finalized.
* Review by Phase 6 implementation team.
