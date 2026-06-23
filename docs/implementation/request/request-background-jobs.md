# Request Background Jobs Specification

## 1. File Purpose
Defines the asynchronous tasks and scheduled monitoring requirements for the Request system, ensuring SLAs and policies are enforced without blocking user interactions.

## 2. Scope
*   SLA monitoring and escalation jobs.
*   Expiry and timeout automated checks.
*   Idempotency and audit requirements for background workers.

## 3. Out of Scope
*   Technical worker configuration (e.g., Celery concurrency settings).
*   Infrastructure management (e.g., Redis/SQS).

## 4. Full Content

### 4.1 Scheduled Monitoring Jobs

#### 4.1.1 SLA Monitor
*   **Purpose**: Detect breaches in response targets.
*   **Trigger**: Cron schedule (Every 15 minutes).
*   **Schedule**: `*/15 * * * *`.
*   **Action**: Scan active requests where `sla_status != 'breached'`. If `now > target_time`, trigger `escalation.triggered` and notify Manager.
*   **Idempotency**: Use `select_for_update` on Request row to prevent duplicate escalation records.

#### 4.1.2 Quote Expiry Monitor
*   **Purpose**: Enforce the 30-day validity window.
*   **Trigger**: Cron schedule (Daily).
*   **Schedule**: `0 0 * * *`.
*   **Action**: Find quotes with `created_at < now - 30 days`. Set quote status to `expired`.
*   **Follow-on Action**: Transition associated Request to `cancelled` (System Action).

#### 4.1.3 Assignment Timeout Monitor
*   **Purpose**: Handle technicians who fail to respond.
*   **Trigger**: Cron schedule (Hourly).
*   **Schedule**: `0 * * * *`.
*   **Action**: Scan assignments in `assigned` state for > 48 hours. Mark as `timeout` (counts as decline). Trigger reassignment or escalation if cumulative declines = 3.

### 4.2 On-Demand Async Jobs

#### 4.2.1 Verification Reminder
*   **Purpose**: Prevent work from sitting in `pending_verification`.
*   **Trigger**: 24 hours after verification submission.
*   **Action**: Notify Staff/Manager of pending review.

#### 4.2.2 Escalation Job
*   **Purpose**: Orchestrate high-priority routing.
*   **Trigger**: Event-driven (e.g., 3rd decline detected).
*   **Action**: Move Request to `escalated` state; alert Manager group.

## 5. Audit Requirements
*   Every background action that modifies a Request or Quote state MUST be audited.
*   The `actor_id` for automated jobs must be recorded as `system`.
*   The `correlation_id` of the job execution must be linked to the state change.
