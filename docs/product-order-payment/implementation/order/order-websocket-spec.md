# Order WebSocket Specification (Future Phase 6)

## 1. Purpose
The purpose of this document is to define the future real-time communication requirements for the Order Domain. It establishes the foundational blueprints for how Phase 5 Domain Events will be translated into WebSocket broadcasts in Phase 6, ensuring that the transition to real-time client updates honors all existing architectural, RBAC, and payload contracts.

## 2. Scope
This document covers:
* Future real-time event inventory for the Order lifecycle.
* Future authorization and visibility requirements for Order channels.
* Future delivery constraints and client integration expectations.
* The explicit boundary separating Phase 5 event emission from Phase 6 real-time delivery.

## 3. Out of Scope
* **Strict Phase 5 Exclusion:** No real-time delivery, WebSocket routing, connection management, or Channel layer usage exists in Phase 5.
* Real-time tracking of physical shipping or logistics.
* Technical implementations of ASGI servers (e.g., Daphne/Uvicorn).

## 4. Dependencies
* **Order Domain Events:** Source of the payloads to be broadcast.
* **Order Permissions Architecture:** Defines the IDOR constraints for future channel subscriptions.
* **Phase 6 Implementation:** The actual consumer of this blueprint.

## 5. Phase Boundary
* **Phase 5 Responsibility:** Emit strictly formatted domain events to the internal event system (e.g., `order.created`, `order.fulfilled`) immediately following atomic database commits.
* **Phase 6 Responsibility:** Subscribe to these domain events, evaluate WebSocket connection authorization, and convert the domain events into real-time delivery payloads.

## 6. Future Realtime Event Inventory

### 6.1 `order.created`
* **Domain Owner:** Order Domain
* **Producer:** `OrderService` (via Event Publisher)
* **Future Consumers:** Phase 6 WebSocket Event Bridge.
* **Required Payload Source:** `docs/implementation/order/order-event-contracts.md` (Must mirror the internal Domain Event payload exactly).
* **Audit Dependency:** The underlying state transition must already be secured and logged in the Audit system before this event triggers a broadcast.

### 6.2 `order.fulfilled`
* **Domain Owner:** Order Domain
* **Producer:** `FulfillmentService` (via Event Publisher)
* **Future Consumers:** Phase 6 WebSocket Event Bridge.
* **Required Payload Source:** `docs/implementation/order/order-event-contracts.md`
* **Audit Dependency:** Correlated to the `order.fulfilled` audit action.

## 7. Future Authorization Requirements
When Phase 6 implements the channel topology, the following rules MUST govern subscription and delivery:
* **Customer Isolation:** Customers may ONLY receive real-time updates for orders where `order.customer_id == user.id`.
* **Staff Visibility:** Staff may receive updates for any order they are authorized to view or fulfill.
* **Manager/Superadmin:** Visibility follows global RBAC policy; unrestricted access to administrative channels.

## 8. Future Delivery Requirements
* **At-Least-Once Delivery:** The system aims for at-least-once delivery; duplicate client events are acceptable and must be handled idempotently by the frontend.
* **Server Authority:** The server remains the sole source of truth. Real-time messages are notifications of state changes, not authoritative commands.
* **Reconnect Tolerance:** Clients must tolerate unexpected disconnects.
* **State Refresh:** Clients MUST refresh their application state from the authoritative REST APIs (`GET /api/v1/orders/`) upon reconnecting to ensure no events were missed during downtime.

## 9. Future Testing Requirements
Phase 6 must implement tests verifying:
* Request validation for channel subscriptions.
* Proper eviction and teardown of connections upon logout.
* IDOR prevention across WebSocket channels.

## 10. Forbidden Phase 5 Behavior
The following are explicitly prohibited in the Phase 5 MVP codebase:
* Defining WebSocket consumers (`consumers.py`).
* Utilizing `channels.layers.get_channel_layer()`.
* Delivering real-time notifications to the client.
* Managing connection lifecycles, presence tracking, or subscriptions.
* Any direct client pushes.

## 11. Open Questions
No unresolved websocket specification questions remain.

## 12. Completion Criteria
* The document provides sufficient detail for Phase 6 engineers to implement real-time consumers, authorization, and event subscriptions without requiring modifications to the Phase 5 architecture.
* The boundary separating domain event emission (Phase 5) from real-time delivery (Phase 6) is rigidly codified.
