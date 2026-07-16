# Notification & WebSocket Architecture Audit

## 1. Executive Summary
This audit examines the implementation state of the Entercom notification and realtime architecture across the monorepo. The core foundation for both WebSockets and Inbox Notifications exists, including First-Frame Authentication, heartbeat monitoring, and a robust `Notification` schema.

However, a critical implementation gap exists: Domain Events (e.g., Request Created, Booking Scheduled) successfully broadcast realtime invalidations to the frontend via WebSockets, but they **completely bypass** the `Notification` inbox system. The `DispatchOrchestrator` responsible for creating persistent notifications and resolving email/push deliveries is currently unused outside of test suites.

## 2. Backend Audit

### Domain Events (Current State)
Currently published events primarily originate from two dispatchers:
*   `apps.requests.events.publishers` -> `WebSocketEventPublisher.dispatch_domain_event`
*   `apps.bookings.events.publishers` -> `BookingWebSocketDispatcher.dispatch`

**Observations:**
*   **Missing Events:** Orders, Quotes, Payments, and Verification flows do not appear to publish domain events to the WebSocket bridge.
*   **Bypass Issue:** Domain publishers bridge directly to Django Channels. They do not trigger `DispatchOrchestrator.dispatch_event`. Thus, persistent notifications are never created for business events.

### Notification Models & Service
*   **Implemented:** `Notification`, `NotificationPreference`, `NotificationDelivery`.
*   **Implemented Services:** `DispatchOrchestrator`, `PreferenceResolver`, `DeliveryMonitor`, `FailureRecoveryService`.
*   **Gap:** The orchestrator is fully built but completely orphaned from the business logic.

### WebSocket Infrastructure
*   **Channels:** Configured and active.
*   **Consumers:** 
    *   `SystemConsumer` handles baseline connectivity and permissions.
    *   `RequestConsumer` handles dynamic role-based and explicit `request_{id}` subscriptions.
    *   `ConnectionManager` correctly implements Phase 6 First-Frame Auth and Heartbeats.
*   **Gap:** Authorization logic in `RequestConsumer._is_authorized_for_request` is tightly coupled to `Request` models and ignores other resources (Orders, Quotes).

### Celery & Queues
*   **Implemented:** Tasks for Email (`task_dispatch_email`), Push (`task_dispatch_push`), transient sweeps, and retention policies.
*   **Gap:** Because `DispatchOrchestrator` isn't triggered, these delivery queues currently sit idle.

### Signals
*   **Implemented:** `notification_created` (in `apps/notification/signals.py`) correctly bridges newly created persistent notifications to the WebSocket `user.{id}.notifications` channel.

## 3. Frontend Audit

### Implemented Components
*   **Hooks:** `useWebsocket.ts`, `useNotifications.ts`.
*   **UI:** `NotificationCenter.tsx`, `NotificationPreferences.tsx`, Toast alerts.
*   **Logic:** The WebSocket provider correctly listens for `request.*`, `booking.*`, etc., and invalidates `react-query` cache to trigger UI refreshes. Reconnect and Heartbeat logic is properly implemented.

### Gaps
*   **Empty Inbox:** Because the backend does not persist `Notification` records for business events, the `NotificationCenter` (Bell Icon) remains permanently empty for end-users.
*   **Missing Invalidation:** While `request.*` and `booking.*` invalidate the cache, missing backend events for Orders, Payments, and Quotes mean those domains lack realtime updates on the frontend.

## 4. End-to-End Flow Audit

### Customer Flow
*   **Request Created:** WebSocket ✅ | In-App ❌ | Email ❌
*   **Quote Received/Approved:** WebSocket ❌ | In-App ❌ | Email ❌
*   **Payment Required/Received:** WebSocket ❌ | In-App ❌ | Email ❌
*   **Booking Scheduled:** WebSocket ✅ | In-App ❌ | Email ❌

### Staff/Manager Flow
*   **New Request / Assignment:** WebSocket ✅ | In-App ❌ | Email ❌
*   **Verification / Escalation:** WebSocket ❌ | In-App ❌ | Email ❌

## 5. Event Catalog

| Event Name | Producer | WebSocket Consumer (Frontend) | Persistent Notification |
| :--- | :--- | :--- | :--- |
| `request.created` | Request Publisher | `['requests']` Invalidated | None |
| `request.assigned` | Request Publisher | `['requests']` Invalidated | None |
| `booking.scheduled` | Booking Publisher | `['bookings']` Invalidated | None |
| `quote.created` | *Missing* | *Missing* | None |
| `order.fulfilled` | *Missing* | *Missing* | None |

## 6. Channel Mapping & Email/SMS Evaluation

For MVP, SMS is **NOT** strictly required. Email is sufficient for critical offline alerts.

| Event | WebSocket (Realtime UI) | In-App (Inbox) | Email (Offline Alert) | Reason |
| :--- | :--- | :--- | :--- | :--- |
| Quote Ready | ✅ | ✅ | ✅ | Critical block. Customer must approve. |
| Payment Required | ✅ | ✅ | ✅ | Critical block. Service halted. |
| Booking Scheduled | ✅ | ✅ | ✅ | Time-sensitive physical coordination. |
| Request Created | ✅ | ✅ | ❌ | Acknowledgment handled by UI. |
| In Progress | ✅ | ✅ | ❌ | Good to know, but no action needed. |

## 7. Security Audit
*   **WebSocket Auth:** First-Frame authentication via JWT is secure.
*   **Tenant/Role Isolation:** `RequestConsumer` strictly checks RBAC before allowing `request_{id}` subscriptions.
*   **Gap:** The global `system` broadcast channels might leak non-sensitive metadata if not carefully audited, but direct resource access is secured.

## 8. Missing Features
*   **Unified Domain Publisher:** Domain events do not create persistent notifications.
*   **Realtime Parity:** Orders, Payments, Quotes, and Verification domains lack event publishers.
*   **Email Providers:** The Celery email dispatcher (`_send_email_mock`) is currently mocked.

## 9. Recommended Improvements
1.  **Orchestrator Integration:** Refactor Domain Publishers to trigger `DispatchOrchestrator` instead of interacting with the `EventBridge` directly. Let the orchestrator's `post_save` signal handle the WebSocket broadcast.
2.  **Expand Event Vocabulary:** Add `EventBridge` publishers for Quotes, Orders, Payments, and Verification.

## 10. Implementation Roadmap

### Priority 1: Critical Blockers (The Bypass Issue)
*   Refactor `requests` and `bookings` domain event publishers to call `DispatchOrchestrator.dispatch_event`.
*   Ensure `Notification` models are generated so the frontend Inbox functions correctly.

### Priority 2: Missing Realtime Parity
*   Implement event publishers in `quotes`, `orders`, `payments`, and `verification` apps.
*   Map these new events to frontend query invalidation in `useWebsocket.ts`.

### Priority 3: Email Integration (MVP Requirement)
*   Replace `_send_email_mock` in Celery tasks with a real provider (e.g., SendGrid/AWS SES).
*   Create `NotificationTemplate` models for the MVP Email events (Quotes, Payments, Bookings).

### Priority 4: SMS / Push Notifications
*   Deferred until Post-MVP. User preferences already support the schema, but providers can be mocked for now.
