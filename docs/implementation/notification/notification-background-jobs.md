# Notification Background Jobs Design

## Purpose
The purpose of this document is to define the asynchronous tasks and scheduled cron jobs required to support the Notification Domain. These background processes ensure that the primary user-facing API remains highly responsive by offloading heavy I/O operations and periodic maintenance tasks to dedicated worker queues.

## Scope
- Asynchronous task definitions for physical notification dispatch.
- Scheduled (cron) jobs for retry mechanisms and dead-letter sweeping.
- Scheduled jobs for database retention and archiving policies.

## Out of Scope
- Celery worker infrastructure deployment configurations (e.g., Kubernetes HPA settings).
- Configuration of the Redis message broker memory limits.

## Definitions
- **Async Task**: A discrete unit of work pushed to a queue (e.g., Celery) to be executed as soon as a worker is available. Usually triggered by a real-time event.
- **Scheduled Job (Beat Task)**: A recurring unit of work triggered at specific time intervals (e.g., via Celery Beat) to perform batch operations.
- **Batched Execution**: Processing database records in limited chunks to prevent memory exhaustion and table locking.

## Architecture

### 1. Asynchronous Dispatch Tasks
When the Notification Orchestrator resolves a notification, it spawns individual Celery tasks for each target channel to handle the slow network I/O of external providers.

- **`task_dispatch_email(delivery_attempt_id)`**:
  - Fetches the payload, renders the HTML template, and communicates with the Email provider API.
  - Handles transient provider timeouts by raising a specialized retry exception to utilize Celery's built-in retry mechanics.

- **`task_dispatch_push(delivery_attempt_id)`**:
  - Fetches the user's active push tokens from the Users domain.
  - Communicates with APNS/FCM.
  - Must handle token invalidation (e.g., device unregistered) gracefully without throwing unhandled exceptions.

### 2. Scheduled Recovery & Cleanup Jobs
These tasks run periodically (via Celery Beat) to maintain system health and enforce architectural policies.

- **`job_sweep_transient_failures` (Runs every 5 minutes)**:
  - Scans the `DeliveryAttempt` table for records stuck in the `FAILED` state that are eligible for retry based on the exponential backoff schedule.
  - Re-enqueues them into the Async Dispatch queues.

- **`job_enforce_retention_policy` (Runs daily at 02:00 AM UTC)**:
  - Implements the Data Retention Architecture.
  - Identifies `READ` notifications older than 30 days and transitions them to `ARCHIVED`.
  - Identifies `UNREAD` notifications older than 90 days and transitions them to `ARCHIVED`.
  - Physically purges `ARCHIVED` notifications older than 365 days using chunked `DELETE` statements (e.g., deleting 1,000 records at a time and sleeping for 100ms to prevent database deadlocks).

- **`job_purge_successful_deliveries` (Runs daily at 03:00 AM UTC)**:
  - Scans the `DeliveryAttempt` table and physically deletes records with a `SENT` status older than 14 days, preventing exponential table growth for purely historical, successful delivery logs.

### 3. Celery Task Configuration
All dispatch tasks MUST be configured with acks_late=True to ensure messages are not lost if a worker crashes mid-execution. The visibility_timeout must exceed the maximum execution time.

## Responsibilities
- **Task Idempotency**: All background tasks MUST be idempotent. If a worker crashes halfway through `task_dispatch_email` and the task is retried, it must safely verify the `idempotency_key` against the provider or database to ensure the user does not receive the same email twice.
- **Chunking**: Scheduled jobs must never load the entire dataset into memory (e.g., `Notification.objects.all().delete()`). They must use database-level iterators or slicing.

## Dependencies
- **Celery & Celery Beat**: Required for task execution and scheduling.
- **Redis Broker**: Required as the transport layer for Celery.

## Open Questions
- None. Background processing strategies map directly to the defined delivery and retention architectures.

## Completion Criteria
- The discrete asynchronous tasks required for channel dispatch are defined.
- The scheduled jobs required for retry sweeps and data retention are defined.
- Requirements for task idempotency and batched execution are established.
