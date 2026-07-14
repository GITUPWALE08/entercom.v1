# Notification API Design

## Purpose
The purpose of this document is to define the RESTful API endpoints exposed by the Notification Domain. These endpoints allow the frontend applications (Customer, Staff, Manager, Admin portals) to interact with the notification inbox and manage user preferences securely.

## Scope
- End-user inbox endpoints (List, Read, Archive).
- End-user preference endpoints (List, Update).
- Pagination, filtering, and unread count aggregations.

## Out of Scope
- Administrative endpoints (e.g., viewing another user's inbox). These are covered in `notification-admin-spec.md`.
- Endpoints for *creating* notifications (these are triggered via the Event Bus, not REST).
- Defining the exact JSON serializer formats for internal Django views.

## Definitions
- **Pagination**: Breaking down a large dataset (like a historical inbox) into smaller, manageable chunks (e.g., Cursor or Offset pagination).
- **Idempotent**: An API method (like PUT or DELETE) that produces the same result on the server regardless of how many times it is executed.

## Architecture

### 1. Inbox Endpoints
These endpoints are strictly scoped to the currently authenticated user (`request.user.id`).

- **GET /api/v1/notifications/**
  - *Purpose*: Retrieve a paginated list of the user's notifications.
  - *Query Parameters*: 
    - `status=UNREAD` (Filter by read state)
    - `category=marketing` (Filter by category)
  - *Response*: Paginated array of Notification objects.

- **GET /api/v1/notifications/unread-count/**
  - *Purpose*: Retrieve the aggregate count of unread notifications for badge rendering.
  - *Response*: `{ "count": 14 }`

- **POST /api/v1/notifications/{id}/mark-read/**
  - *Purpose*: Idempotently mark a specific notification as `READ`.
  - *Response*: 200 OK. Emits a state change event for WebSocket synchronization.

- **POST /api/v1/notifications/mark-all-read/**
  - *Purpose*: Bulk update all currently `UNREAD` notifications for the user to `READ`.
  - *Response*: 200 OK. 

- **POST /api/v1/notifications/{id}/archive/**
  - *Purpose*: Logically hide a notification from the primary inbox view. (Physical deletion is handled by background retention sweeps).
  - *Response*: 200 OK.

### 2. Preference Endpoints
These endpoints allow users to manage their overrides.

- **GET /api/v1/notifications/preferences/**
  - *Purpose*: Retrieve the current state of the user's preferences, dynamically merging their overrides with the system global defaults so the UI can render accurate toggle switches.
  - *Response*: Array of preference configurations.

- **PUT /api/v1/notifications/preferences/{category}/{channel}/**
  - *Purpose*: Upsert a specific preference override.
  - *Payload*: `{ "is_enabled": false }`
  - *Response*: 200 OK. Invalidates the preference cache in Redis.

## Responsibilities
- **API Gateway / Middleware**: Must firmly authenticate the JWT and inject the `user_id` into the request context.
- **View Layer**: Must strictly enforce tenancy. If User A requests `/api/v1/notifications/UserB_UUID/mark-read/`, the view MUST return a 404 Not Found (not a 403, to prevent ID enumeration).

## Dependencies
- **Authentication**: Requires a valid user session/token.
- **Service Layer**: The API views must not contain business logic; they must delegate to the `InboxManagementService` and `PreferenceResolverService`.

## Open Questions
- None. The API design adheres strictly to the architectural constraints.

## Completion Criteria
- End-user endpoints for inbox retrieval, state mutation, and preference management are defined.
- Tenancy enforcement rules (preventing ID enumeration) are established.
