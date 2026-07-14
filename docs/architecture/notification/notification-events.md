# Notification Events Architecture

## Purpose
The purpose of this document is to define the events produced by and consumed by the Notification Domain. It establishes the event contracts that allow the Notification system to remain decoupled from the core business domains while successfully broadcasting system activity.

## Scope
- Inbound events consumed by the Notification Domain (triggering notifications).
- Outbound events produced by the Notification Domain (e.g., delivery status changes).
- The contract and payload structure expected for notification events.

## Out of Scope
- Internal Celery task payloads (these are implementation details).
- Webhook payloads for external systems.
- Definition of events belonging to other domains (e.g., defining `RequestCreated`).

## Definitions
- **Inbound Event**: An event published by a core domain (Requests, Orders, etc.) that the Notification Domain listens to in order to trigger a notification.
- **Outbound Event**: An event published by the Notification Domain to broadcast the state of a notification (e.g., `NotificationRead`, `DeliveryFailed`).

## Architecture
The Notification Domain relies heavily on an asynchronous event bus (or publish-subscribe pattern) to decouple itself from the synchronous critical path of the application. 

### Inbound Flow
1. A core domain publishes a standardized business event (e.g., `QuoteApproved`).
2. The Notification Orchestrator subscribes to this event.
3. The Orchestrator maps the event to a specific Notification Type and extracts required template context (e.g., `actor_id`, `resource_id`, `message`).

### Outbound Flow
1. As the notification progresses through its lifecycle, the Notification Domain emits state-change events.
2. These events can be consumed by the Audit Domain for historical tracking or by the WebSocket Domain for real-time UI updates (e.g., updating the unread badge count).

## Responsibilities
- **Event Contracts**: Enforce strict validation on inbound events to ensure all necessary data (recipient, fallback message, resource link) is present before attempting delivery.
- **State Broadcasting**: Emit reliable outbound events when a notification is created, read, or fails permanently, allowing other systems to react.

## Dependencies
- **Core Domains (Requests, Orders, Users)**: As producers of inbound events.
- **WebSocket Domain**: As a consumer of outbound events (e.g., to push a "Notification Read" update to the client).
- **Audit Domain**: As a consumer of outbound events to log administrative actions or delivery failures.

## Open Questions
All business and technical decisions have been resolved:

**Question:** Generic SendNotificationCommand or Business Events?
**Decision:** Notification Domain subscribes only to business domain events.

Examples:

RequestCreated

QuoteApproved

OrderFulfilled

PaymentSucceeded

VerificationCompleted

Notification mapping occurs internally.

**Question:** How much contextual data belongs inside events?
**Decision:** Events shall contain identifiers and minimal metadata only.

Notification Service lazily fetches required domain objects.

## Completion Criteria
- The integration points between the Notification Domain and the rest of the system via events are clearly defined.
- The distinction between inbound triggering events and outbound state events is established.
