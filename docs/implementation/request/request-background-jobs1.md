# Request Background Jobs

## 1. File Purpose
Defines the asynchronous workers and scheduled tasks required to maintain the Request Lifecycle system.

## 2. Scope
*   Monitoring jobs for SLA, Expiry, and Timeouts.
*   Triggers, schedules, and actions for each job.

## 3. Out of Scope
- Celery worker performance tuning.
- Queue priority configuration.

## 4. Full Content

### 4.1 Scheduled Tasks

#### SLA Monitor
*   **Trigger**: Recurrent (Every 15 minutes).
*   **Schedule**: `*/15 * * * *`.
*   **Action**: Scan active Requests; if `timezone.now() > sla_target_time`, trigger `escalation.triggered` event.
*   **Audit Req**: Log `sla_breach_detected` with delay interval.

#### Quote Expiry Monitor
*   **Trigger**: Recurrent (Daily).
*   **Schedule**: `0 0 * * *`.
*   **Action**: Find quotes with `created_at < now - 30 days`. Mark quote `expired`; transition Request to `cancelled`.
*   **Audit Req**: Log `quote.expired` and `request.cancelled`.

#### Assignment Timeout Monitor
*   **Trigger**: Recurrent (Every 1 hour).
*   **Action**: Find Assignments in `assigned` where `assigned_at < now - 48 hours`.
*   **Action**: Execute `AssignmentService.handle_timeout()`; increment decline count.
*   **Audit Req**: Log `assignment.timeout_recorded`.

### 4.2 On-Demand Async Jobs

#### Verification Reminder
*   **Status**: Deferred
*   **Trigger**: On Transition to `pending_verification`.
*   **Action**: Not included in Phase 3 MVP. Future enhancement.
*   **Implementation**: No service implementation or Celery task required for Phase 3.

#### Parent-Child Data Sync
*   **Status**: Not Applicable (Synchronous)
*   **Trigger**: On Child Request Creation.
*   **Action**: Inheritance occurs during child request creation. Handled synchronously by `RequestService`.
*   **Implementation**: No asynchronous synchronization process exists. No Celery task implementation required.
*   **Audit Req**: Log `inheritance_sync_completed`.
