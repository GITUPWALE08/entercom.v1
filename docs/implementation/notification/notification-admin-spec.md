# Notification Admin Specification

## Purpose
The purpose of this document is to define the technical implementation required to support the administrative tools outlined in the architecture. It details the internal APIs and secure service methods that empower system operators to inspect and manipulate notification delivery flows without compromising user data integrity.

## Scope
- Endpoints and services for inspecting Dead-Letter Queues (DLQ).
- Implementation of the Forced Re-dispatch functionality.
- Endpoints for verifying global health metrics.
- Enforcing Role-Based Access Control (RBAC) on admin APIs.

## Out of Scope
- Frontend dashboard component implementation.
- Standard user inbox endpoints (defined in `notification-api-design.md`).
- Broad platform auditing APIs (managed by the Audit domain).

## Definitions
- **Dead-Letter Queue (DLQ)**: The database view or logical state representing all `DeliveryAttempt` records with a status of `DEAD_LETTERED`.
- **Forced Re-dispatch**: The process of manually circumventing the maximum retry count to force the system to attempt delivery again.

## Architecture

### 1. Administrative APIs
The Notification Domain exposes a distinct subset of endpoints strictly protected by the `Admin-User` role requirement. These endpoints do NOT enforce the standard `recipient_id` tenancy checks, as admins require cross-tenant visibility.

- **GET /api/v1/admin/notifications/health/**
  - *Purpose*: Provides aggregate counts of active deliveries grouped by status and channel.
  - *Response*: `{ "EMAIL": { "PENDING": 12, "FAILED": 5, "DEAD_LETTERED": 143 } }`
  
- **GET /api/v1/admin/notifications/deliveries/dead-lettered/**
  - *Purpose*: Returns a paginated list of `DeliveryAttempt` records specifically in the `DEAD_LETTERED` state, including the `provider_response` metadata for diagnostic review.
  
- **POST /api/v1/admin/notifications/deliveries/{id}/redispatch/**
  - *Purpose*: Manually force a retry for a specific failed delivery.
  - *Workflow*:
    1. Validates the `Admin-User` permission.
    2. Verifies the `DeliveryAttempt` is currently `FAILED` or `DEAD_LETTERED`.
    3. Emits an audit event (`domain.notifications.audit.admin_redispatch`) containing the admin's `actor_id` and the `delivery_id`.
    4. Resets the `retry_count` to 0.
    5. Transitions the status to `PENDING`.
    6. Enqueues a new Celery dispatch task.

### 2. Preference Read-Only Access
To support customer service interactions, admins require visibility into a user's configuration.
- **GET /api/v1/admin/notifications/preferences/{user_id}/**
  - *Purpose*: View the exact preference state for a specific user to diagnose "missing email" complaints.
  - *Constraint*: As per the resolved business decision, admins are NOT permitted to mutate these preferences on behalf of the user. There is no `PUT` or `POST` method exposed for this endpoint.

### 3. Circuit Breaker Controls
While the Circuit Breaker pattern protects the system automatically, admins must have manual override capabilities.
- **POST /api/v1/admin/notifications/circuit/{channel}/override/**
  - *Purpose*: Manually force a channel into an `OPEN` (halted) or `CLOSED` (flowing) state, overriding the automated threshold logic during known outages or maintenance windows.

## Responsibilities
- **API Middleware**: Strictly block any user lacking the necessary administrative role from accessing the `/api/v1/admin/notifications/*` routing path.
- **Admin Service Layer**: Ensure all mutation actions (Redispatch, Circuit Breaker overrides) securely publish immutable logs to the Audit Domain.

## Dependencies
- **Roles/Auth Domain**: For validating the administrative token policies.
- **Audit Domain**: For capturing the required compliance logs.

## Open Questions
- None. Implementation specifics directly address the architectural rules and resolved business decisions.

## Completion Criteria
- Endpoints for DLQ inspection and global health are defined.
- The workflow and auditing requirements for a Forced Re-dispatch are established.
- The constraint preventing admins from altering user preferences is enforced at the API layer.
