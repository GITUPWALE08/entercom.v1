# Notification Domain Architecture

## Purpose
The purpose of this document is to define the core concepts, boundaries, and language (Ubiquitous Language) for the Notification domain within the Entercom platform (Phase 6). It establishes how notifications are modeled, processed, and categorized across the system.

## Scope
- Definition of a Notification entity and its core attributes.
- Delivery policies (guaranteed delivery, dead-letter handling, retry mechanisms).
- Notification preferences and channel configurations (In-app, WebSocket, Email, Push).
- Notification lifecycle states (Created, Pending, Sent, Delivered, Read, Failed).
- Administration visibility and control over the notification flow.

## Out of Scope
- Real-time chat functionality.
- Direct implementation details (models, serializers, consumers).
- Internal workings of the external push/email providers (e.g., SendGrid, APNS, FCM).

## Definitions
- **Notification**: An immutable record of an event that occurred in the system, directed at a specific user or group of users.
- **Channel**: A medium through which a notification is delivered (In-App, WebSocket, Email, Push).
- **Delivery**: The attempt to send a notification through a specific channel.
- **Dead-letter Queue (DLQ)**: A repository for notifications that have repeatedly failed to deliver and exceeded the maximum retry count.
- **Preference**: A user-specific configuration dictating which types of events should trigger notifications and on which channels.

## Architecture
The Notification Domain sits horizontally across the platform, acting as a consumer of events emitted by other domains (e.g., Requests, Orders, Payments). It acts as a central hub that translates domain events into user-digestible messages and routes them through the appropriate delivery channels based on user preferences.

1. **Event Ingestion**: Listens to core system events (e.g., `RequestEscalated`, `QuoteApproved`).
2. **Preference Resolution**: Consults the user's notification settings to determine the target channels.
3. **Dispatch & Delivery**: Queues delivery tasks for each resolved channel.
4. **State Tracking**: Monitors the lifecycle of each delivery attempt, managing retries and dead-letters.

## Responsibilities
- Guaranteeing delivery of critical system events to end-users.
- Managing user notification preferences globally.
- Abstracting external delivery mechanisms (Email/Push) away from core business domains.
- Maintaining an auditable history of what was sent, when, and to whom.
- Handling transient network or provider failures gracefully via retries.

## Dependencies
- **Users Domain**: For resolving recipient details and preferences.
- **Event Bus / Celery**: For async event processing and guaranteed delivery retries.
- **WebSocket Domain**: For real-time, in-app delivery.
- **Audit Domain**: For tracking manual administrative interventions (e.g., resending a failed notification).

## Open Questions
All business and technical decisions have been resolved:

**Question:** Default retention period?
**Decision:** 180 days

Archived afterwards.

Purged according to retention policy.

**Question:** Are there notification types that bypass preferences?
**Decision:** Yes.

System Critical notifications bypass user preferences.

Includes:

Password Reset

MFA

Account Security

Account Lock

Administrative Security Alerts

## Completion Criteria
- Domain boundaries for Notification are clearly defined.
- The lifecycle and delivery policy for a notification are universally understood.
- Definitions align with the overarching enterprise architecture.
