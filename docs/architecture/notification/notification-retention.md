# Notification Retention Architecture

## Purpose
The purpose of this document is to define the lifecycle management and permanent storage policies for notifications within the platform. It establishes the rules for how long notifications are kept, when they are archived, and when they are permanently purged from the database to ensure system scalability and data compliance.

## Scope
- Time-to-Live (TTL) policies for Read and Unread notifications.
- Retention limits for failed delivery logs (Dead-Letter Queue).
- Mechanisms for purging historical notification data.
- System-wide archiving policies.

## Out of Scope
- Data warehousing or long-term cold storage implementations (e.g., AWS Glacier).
- Retention of the core business resources that triggered the notifications.

## Definitions
- **Retention Period**: The exact duration a notification record is guaranteed to remain accessible in the primary database.
- **Purge**: The physical, permanent deletion of a record from the database.
- **Archive**: A logical state (or secondary fast-access storage) where notifications are hidden from the primary inbox but remain accessible for historical queries.

## Architecture

### Retention Tiers
To prevent uncontrolled database bloat, the Notification Domain enforces strict retention tiers managed by scheduled background jobs.

1. **Unread Notifications**:
   - Must be retained longer to allow users sufficient time to acknowledge critical system events.
   - Example Policy: Retained for 90 days. If unread after 90 days, automatically transitioned to the `Archived` state.

2. **Read Notifications**:
   - Standard informational notifications that have been acknowledged.
   - Example Policy: Retained in the primary inbox view for 30 days post-read, then automatically transitioned to the `Archived` state.

3. **Archived Notifications**:
   - Retained for historical compliance and deep-link resolution.
   - Example Policy: Physically purged from the database after 365 days from creation.

4. **Delivery Logs & Dead-Letter Queue (DLQ)**:
   - High-volume mechanical logs used for troubleshooting.
   - Example Policy: Successfully sent logs are purged after 14 days. Dead-lettered (failed) logs are purged after 60 days to allow for admin investigation.

### Purge Mechanism
- A scheduled Celery Beat task (e.g., `notification.retention.sweep`) runs during off-peak hours.
- It executes bulk deletions or state updates based on the predefined TTL timestamps (`created_at` or `read_at`).
- The task must operate in batched chunks to prevent database table locking or transaction timeout during high-volume sweeps.

## Responsibilities
- **Background Worker**: Responsible for reliably executing the daily retention sweep.
- **Database Engine**: Must effectively reclaim disk space following massive bulk delete operations (e.g., PostgreSQL auto-vacuum tuning).

## Dependencies
- **Task Scheduler (Celery Beat)**: Required to trigger the retention sweeps automatically.

## Open Questions
All business and technical decisions have been resolved:

**Decision:** Not supported.

**Decision:** Not supported during Phase 6.

Single retention policy:
180 days.

## Completion Criteria
- Retention durations for Unread, Read, and Delivery logs are explicitly defined.
- The automated mechanism for enforcing these limits (background sweep) is documented.
