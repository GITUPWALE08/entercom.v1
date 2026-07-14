# Notification Services Architecture

## Purpose
The purpose of this document is to define the logical services that make up the Notification domain, detailing their responsibilities, boundaries, and how they interact to achieve guaranteed delivery of platform notifications.

## Scope
- Central Notification Service for processing inbound events.
- Preference Resolution Service.
- Dispatch Services for specific channels (In-app, WebSocket, Email, Push).
- Delivery Tracking and Retry Service.
- Administration and Inspection Service.

## Out of Scope
- Code-level implementation details (classes, interfaces).
- Third-party API specific payload mapping.
- WebSocket connection management (handled by the WebSocket Domain).

## Definitions
- **Dispatcher**: A specialized service component responsible for transmitting a formatted message to a specific channel (e.g., Email Dispatcher, Push Dispatcher).
- **Resolver**: A component that takes an event and a target user, and outputs the final list of channels to be used for delivery based on system rules and user preferences.

## Architecture
The domain is conceptually split into a pipeline architecture to decouple event ingestion from the actual delivery mechanics:

1. **Notification Orchestrator Service**: The primary entry point. It receives strongly-typed business events, normalizes them, and prepares the notification payloads.
2. **Preference Resolution Service**: Interrogated by the Orchestrator to determine the active delivery channels for the specific user and event type.
3. **Dispatch Services**:
   - **In-App Dispatcher**: Persists the notification to the database for historical and read-state tracking.
   - **WebSocket Dispatcher**: Forwards the real-time payload to the WebSocket domain.
   - **Email Dispatcher**: Formats and queues the email payload for the external provider.
   - **Push Dispatcher**: Formats and queues the push payload for mobile/PWA delivery.
4. **Retry & Recovery Service**: A background service that periodically sweeps for failed deliveries and re-queues them or moves them to a dead-letter queue (DLQ) if the maximum retry threshold is breached.
5. **Admin Inspection Service**: Exposes internal delivery state, failure logs, and allows manual intervention (e.g., force re-dispatch).

## Responsibilities
- **Orchestrator**: Coordinate the flow from event to dispatch; ensure transactional integrity when recording the initial notification intent.
- **Preference Resolver**: Provide an accurate, cached resolution of user preferences to prevent DB bottlenecks during high-volume broadcasts.
- **Dispatchers**: Handle the specific nuances of their respective channels, including rate limiting, payload formatting, and external provider error handling.
- **Retry Service**: Implement exponential backoff for retries; guarantee that no notification is silently dropped.

## Dependencies
- **Users Domain**: Preference Resolver depends on user profiles and settings.
- **WebSocket Domain**: WebSocket Dispatcher depends on the inter-domain API exposed by the WebSocket system.
- **External Providers**: Email and Push dispatchers depend on third-party availability.

## Open Questions
All business and technical decisions have been resolved:

**Decision:** Yes.

Role-based default preferences shall exist.

Users may override them.

**Decision:** Redis shall coordinate provider rate limits across Celery workers.

## Completion Criteria
- Service boundaries are clearly separated by concern (ingestion, resolution, dispatch, recovery).
- The path of a notification from trigger to delivery (or failure) is clearly mapped through the logical services.
