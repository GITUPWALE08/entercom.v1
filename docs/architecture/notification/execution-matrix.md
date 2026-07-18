# End-to-End Execution Matrix

This matrix documents the end-to-end execution path for every MVP notification type, from the triggering Business Service to the Recipient Inbox.

## Overview of Execution Flow

For all notifications, the execution traces the following path:
1. **Business Service:** Domain logic executes and emits a domain event (e.g. `auth_service.py` or via `mapper.py`).
2. **DispatchOrchestrator:** Intercepts the event, generates a `Notification` record and determines delivery channels via `PreferenceResolver`. Generates `NotificationDelivery` attempts.
3. **Celery Queue:** Enqueues async tasks (`task_dispatch_email` or `task_dispatch_push`).
4. **Worker:** Picks up the task. Transitions delivery status to `PROCESSING` and tracks `processing_started_at`.
5. **NotificationService:** Renders the specific HTML and TXT templates using context.
6. **ProviderFactory:** Resolves the appropriate provider (e.g. `ResendProvider`).
7. **Provider API (Resend):** Sends the payload and records the latency and response.
8. **Recipient Inbox:** Final destination.

---

## MVP Notification Execution Matrix

| Notification Name | Triggering Service | Event Name (Slug) | Expected Inputs | Expected Outputs (Inbox) | Failure Modes | Retry Behaviour |
|-------------------|--------------------|-------------------|-----------------|--------------------------|---------------|-----------------|
| **welcome** | `auth_service.py` (verify_email) | `welcome` | `recipient_id`, `first_name` | Welcome HTML email delivered. | Invalid token, Provider rate limit | Up to 10 retries with exponential backoff for transient provider errors. |
| **verify_email** | `auth_service.py` (register) | `verify_email` | `recipient_id`, `verification_link`, `first_name` | Email with verification link. | Provider outage | Standard transient retries. Circuit breaker activates on 5 successive failures. |
| **password_reset_requested** | `auth_service.py` (request_password_reset) | `password_reset_requested` | `recipient_id`, `reset_link`, `first_name` | Password reset HTML email. | User not found (silent fail) | Standard transient retries. |
| **password_reset_completed** | `auth_service.py` (complete_password_reset) | `password_reset_completed` | `recipient_id`, `first_name` | Confirmation email. | Invalid token | Standard transient retries. |
| **account_locked** | `auth_service.py` (lock_account) | `account_locked` | `recipient_id`, `first_name`, `locked_until` | Account locked alert email. | Provider rejection (e.g. bounce) | Bounced emails marked as DEAD_LETTERED. |
| **request_submitted** | `request_service.py` (via mapper) | `request_submitted` | `customer_id`, `request_id` | Request confirmation HTML. | Missing request context | Retried via `job_sweep_transient_failures` if worker dies unexpectedly. |
| **technician_assigned** | `assignment_service.py` (via mapper)| `technician_assigned` | `technician_id`, `request_id` | Assignment alert email. | Missing technician email | Fails permanently (DEAD_LETTERED). |
| **quote_ready** | `quote_service.py` (via mapper) | `quote_ready` | `customer_id`, `request_id` | Quote ready notification. | Invalid context mapping | Permanent template error -> DEAD_LETTERED. |
| **request_completed** | `request_service.py` (via mapper) | `request_completed` | `customer_id`, `request_id` | Job completed confirmation. | Missing request object | Standard transient retries. |
| **booking_confirmed** | `booking_service.py` (via mapper) | `booking_confirmed` | `customer_id`, `start_time` | Booking scheduled alert. | Provider rate limit | Exponential backoff (up to 3600s). |
| **booking_reminder** | Celery Beat Cron | `booking_reminder` | `customer_id`, `request_id` | Upcoming booking reminder. | Provider outage | Circuit breaker triggers, queues pending for sweeping. |
| **payment_receipt** | `webhook_service.py` (via mapper) | `payment_receipt` | `customer_id`, `order_id` | Payment receipt HTML. | Missing order object | Permanent error (Invalid payload) -> DEAD_LETTERED. |

---

## Shared Observability and Verification

For every stage in the matrix above, the following are consistently verified and recorded by the subsystem:

- **Audit Logging:** Every success, failure, and resend is logged via `log_action` ensuring an immutable audit trail.
- **Correlation IDs:** Every notification creates a unique `correlation_id` to allow precise tracking across distributed services.
- **Provider Logging:** Request, response, and detailed error codes from external APIs (like Resend) are persisted directly to the `NotificationDelivery` object.
- **Retry Handling:** The `DeliveryRetry` model tracks the complete history of all attempts including the exact reason and delay for each failure.
