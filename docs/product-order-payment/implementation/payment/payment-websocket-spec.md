# Payment WebSocket Specification (Future Phase 6)

## 1. Purpose
The purpose of this document is to define the future real-time communication requirements for the Payment Domain. It establishes the architectural contract for broadcasting critical financial state transitions to connected clients, reinforcing the principle that real-time messages reflect the authoritative server state rather than dictating it.

## 2. Scope
This document covers:
* Future real-time event inventory for payment settlements and failures.
* Future authorization and IDOR requirements for Payment channels.
* Future delivery constraints for financial signals.
* The explicit boundary separating Phase 5 event emission from Phase 6 real-time delivery.

## 3. Out of Scope
* **Strict Phase 5 Exclusion:** No real-time delivery, WebSocket routing, connection management, or Channel layer usage exists in Phase 5.
* Real-time tracking of webhooks payloads (security concern).
* Technical implementations of ASGI servers (e.g., Daphne/Uvicorn).

## 4. Dependencies
* **Payment Domain Events:** Source of the payloads to be broadcast.
* **Payment Permissions Architecture:** Defines the IDOR constraints for future channel subscriptions.
* **Phase 6 Implementation:** The actual consumer of this blueprint.

## 5. Phase Boundary
* **Phase 5 Responsibility:** Securely process webhooks and emit strictly formatted domain events to the internal event system (e.g., `payment.paid`, `payment.failed`) immediately following atomic database commits.
* **Phase 6 Responsibility:** Subscribe to these domain events, securely map the payment to the authorized user, and convert the domain events into real-time delivery payloads.

## 6. Future Realtime Event Inventory

### 6.1 `payment.paid`
* **Domain Owner:** Payment Domain
* **Producer:** `WebhookService` (via Event Publisher)
* **Future Consumers:** Phase 6 WebSocket Event Bridge.
* **Required Payload Source:** `docs/implementation/payment/payment-event-contracts.md` (Must mirror the internal Domain Event payload exactly).
* **Audit Dependency:** Requires verified provider webhook and completed idempotency checks prior to emission.

### 6.2 `payment.failed`
* **Domain Owner:** Payment Domain
* **Producer:** `WebhookService` (via Event Publisher)
* **Future Consumers:** Phase 6 WebSocket Event Bridge.
* **Required Payload Source:** `docs/implementation/payment/payment-event-contracts.md`
* **Audit Dependency:** Correlated to the `payment.failed` audit action.

## 7. Future Authorization Requirements
When Phase 6 implements the channel topology, the following rules MUST govern subscription and delivery:
* **Customer Isolation:** Customers may ONLY receive real-time updates for payments linked to orders where `order.customer_id == user.id`.
* **Manager/Superadmin:** Visibility follows global RBAC policy; unrestricted access to administrative channels.

## 8. Future Delivery Requirements
* **At-Least-Once Delivery:** The system aims for at-least-once delivery; duplicate client events are acceptable and must be handled idempotently by the frontend UI.
* **Canonical Truth Enforcement:** The provider webhook remains the sole authoritative source of truth. Real-time delivery never changes payment state. Real-time messages reflect server truth only.
* **Reconnect Tolerance:** Clients must tolerate unexpected disconnects.
* **State Refresh:** Clients MUST refresh their financial state from the authoritative REST APIs (`GET /api/v1/payments/{id}/`) upon reconnecting to ensure absolute accuracy.

## 9. Future Testing Requirements
Phase 6 must implement tests verifying:
* Request validation for channel subscriptions.
* IDOR prevention across WebSocket channels (Customer A cannot subscribe to Customer B's payment channel).
* Proper eviction and teardown of connections upon logout.

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
* The rule that Webhooks (not WebSockets) govern payment state is explicitly affirmed.
