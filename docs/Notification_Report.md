# MVP Notification Report

## 1. Implemented Transactional Emails
The following events represent the absolute minimal, production-ready transactional email set required for core business workflows. All of these have been wired into the business services via `DispatchOrchestrator`, supported by `NotificationService` and Celery dispatch, and have matching HTML/TXT templates.

### Authentication
*   `welcome`: Dispatched upon successful email verification.
*   `verify_email`: Dispatched upon user registration and email address changes.
*   `password_reset_requested`: Dispatched when a user requests a password reset.
*   `password_reset_completed`: Dispatched upon successful password reset.
*   `account_locked`: Dispatched when an account is locked due to excessive failed login attempts.

### Requests
*   `request_submitted`: Dispatched when a customer submits a request.
*   `technician_assigned`: Dispatched to the customer when a technician is assigned to their request.
*   `quote_ready`: Dispatched when a quote is successfully created for a customer.
*   `request_completed`: Dispatched via the `RequestProcessOrchestrator` when a request successfully reaches the `COMPLETED` lifecycle state.

### Bookings
*   `booking_confirmed`: Dispatched to the technician when a booking is created/confirmed.
*   `booking_reminder`: Scheduled event (Requires cron job).

### Payments
*   `payment_receipt`: Dispatched when the webhook service successfully registers a `charge.success` from the payment provider.

---

## 2. Deferred Notifications
Per MVP requirements, the following notifications have been decoupled from the business workflows (commented out). They will not be dispatched to avoid spam and unmanageable state mapping until their respective domains are fully matured. No templates or scheduled jobs currently depend on them.

*   **Requests**: `request_created`, `request_cancelled`
*   **Quotes**: `quote_approved`, `quote_rejected`, `quote_revision_requested`, `quote_expired`
*   **Assignments**: `assignment_received`, `assignment_accepted`, `assignment_declined`
*   **Bookings**: `job_started`, `job_completed`
*   **Payments**: `payment_failed`, `payment_expired`, `refund_issued`
*   **Verification**: `verification_required`, `verification_approved`, `verification_failed`
*   **SLA & Escalations**: `sla_breached`, `request_escalated`, `manager_escalated`, `emergency_queue_entered`

*(Additional features such as SMS, Push Notifications, WebSockets, Marketing emails, Analytics, Digests, and Unsubscribe flows have also been deferred entirely.)*

---

## 3. Remaining Templates
*   **Status**: Complete.
*   All MVP events now have successfully generated HTML and TXT templates residing in `apps/notification/templates/email/`.
*   Unused/Deferred event templates remain on the filesystem but are never invoked, leaving them dormant and safely disconnected.

---

## 4. Remaining DispatchOrchestrator Mappings
*   **Status**: Complete.
*   All MVP events are explicitly mapped through `DispatchOrchestrator.dispatch_event(...)`. 
*   All non-MVP event dispatches have been thoroughly commented out of the business services (`request_service.py`, `quote_service.py`, `assignment_service.py`, `booking_service.py`, `payment_service.py`, `webhook_service.py`, `verification_service.py`, `sla_service.py`, `escalation_service.py`).

---

## 5. Remaining Celery Tasks
*   `task_send_booking_reminders` (Cron Job): We require a periodic Celery Beat task to scan for upcoming bookings (e.g., 24 hours in advance) and invoke `DispatchOrchestrator.dispatch_event(event_type="booking_reminder", ...)` for the customer.

---

## 6. Unresolved Dependencies
The notification subsystem is now isolated to the MVP tier. To ever re-introduce the deferred events, the following dependencies must be resolved first by the backend teams:
*   **Check-In/Check-Out APIs**: Required for reliable `job_started` and `job_completed` triggers.
*   **Webhook Reconciliation Task**: Required for resolving edge cases in `payment_failed` and `payment_expired` flows.
*   **Notification Preferences API**: Required so users can selectively mute notifications before we turn the "firehose" of events (like `assignment_declined`, `sla_breached`) back on.
*   **Physical Invoices Module**: Required for sending compliant billing PDFs.
