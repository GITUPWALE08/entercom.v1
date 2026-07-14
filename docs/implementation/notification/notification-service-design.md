# Notification Service Design

## Purpose
The purpose of this document is to define the logical service layer for the Notification Domain. It outlines how business rules, validation, and complex workflows are encapsulated away from the API layer and the raw database models, providing a unified interface for the rest of the application.

## Scope
- Definition of the primary Service classes/modules (e.g., `NotificationOrchestrator`, `PreferenceResolver`, `DeliveryService`).
- Encapsulation of domain logic (e.g., how an event is transformed into a database record).
- Interaction between the Notification Service and the Celery task queue.

## Out of Scope
- Actual Python code implementation.
- API View logic (e.g., HTTP request parsing).
- Event broker configuration (e.g., Redis pub/sub internals).

## Definitions
- **Service Layer**: An abstraction layer that contains the core business logic of the domain, sitting between the API/Event handlers and the Data Access Layer (Models).
- **Orchestrator**: A specialized service pattern that coordinates multiple sub-services to execute a complex workflow (e.g., receiving an event, resolving preferences, and triggering dispatches).

## Architecture

### 1. Notification Orchestrator Service
The entry point for all inbound events triggering a notification.
- **Method Signature Concept**: `dispatch_event(event_type, recipient_id, context, resource_type, resource_id)`
- **Workflow**:
  1. Validates the event type against a known registry.
  2. Calls the `PreferenceResolverService` to determine the target channels.
  3. Creates the core `Notification` record in the database.
  4. For each resolved channel, creates a `DeliveryAttempt` record with status `PENDING`.
  5. Enqueues an asynchronous Celery task for each `DeliveryAttempt`.

### 2. Preference Resolver Service
Responsible for determining exactly which channels a user should receive a specific notification on.
- **Method Signature Concept**: `resolve_channels(user_id, category, is_system_critical)`
- **Workflow**:
  1. If `is_system_critical` is true, immediately return all available primary channels (In-App, Email).
  2. Fetch the user's explicit overrides from the `NotificationPreference` table.
  3. Merge the overrides with the system's global defaults for that category.
  4. Ensure `IN_APP` is always included in the returned set (per the Channel Policy).
  5. Apply a caching layer (Redis) to prevent heavy database reads during mass broadcasts.

### 3. Delivery Processing Service
Executed asynchronously by Celery workers to physically transmit the notification.
- **Method Signature Concept**: `process_delivery(delivery_attempt_id)`
- **Workflow**:
  1. Fetches the `DeliveryAttempt` and associated `Notification`.
  2. Transitions the status to `PROCESSING`.
  3. Delegates to the specific channel dispatcher (e.g., `EmailDispatcher`, `PushDispatcher`).
  4. Parses the response from the dispatcher.
  5. On success: Updates status to `SENT`, purges idempotency keys if necessary.
  6. On failure: Classifies as Transient or Permanent (via the `FailureClassificationService`), updates status to `FAILED` or `DEAD_LETTERED`, and attaches the error metadata.

### 4. Inbox Management Service
Used by the user-facing APIs to interact with their notifications.
- **Method Signature Concept**: `mark_as_read(notification_id, user_id)`, `archive_notification(notification_id, user_id)`
- **Workflow**:
  1. Enforces tenant isolation (verifies the `notification.recipient_id` matches the `user_id`).
  2. Idempotently updates the `status` field.
  3. Emits an outbound event (e.g., `NotificationRead`) for audit trailing.

## Responsibilities
- **Transaction Management**: The Orchestrator must ensure that the creation of the `Notification` and its associated `DeliveryAttempt` records happen within a single atomic database transaction.
- **Isolation**: The Service layer must never accept raw Django `HttpRequest` objects. It must only accept pure data structures (primitive types, Pydantic models, or Dataclasses).

## Dependencies
- **Celery**: The Service Layer relies on Celery to defer the execution of the `Delivery Processing Service`.
- **Cache (Redis)**: Required by the Preference Resolver Service for performance.

## Open Questions
- None. Required behaviors are fully mapped to the architectural specifications.

## Completion Criteria
- The logical service modules are defined with their expected inputs and workflows.
- The separation between synchronous orchestration and asynchronous delivery processing is established.
- The requirement for atomic database transactions during notification creation is documented.
