# Booking Background Jobs Design

## 1. Purpose
The purpose of this document is to define the requirements for scheduled background processes and asynchronous jobs within the Booking domain. It ensures that time-sensitive business rules (such as no-show detection and reminders) are enforced autonomously without requiring active user intervention.

## 2. Scope
This document covers:
* The inventory of scheduled jobs for Booking maintenance and enforcement.
* Trigger conditions and execution frequencies.
* Transactional, locking, and concurrency expectations for background processing.
* Audit and failure handling requirements for system-owned jobs.

## 3. Out of Scope
* Actual Celery task code or Python implementation.
* Specific crontab syntax or task queue configuration.
* Infrastructure scaling rules for worker nodes.

## 4. Definitions
* **System-Owned Job:** An autonomous process that executes without a human actor context (actor_id = 0 or SYSTEM).
* **No-Show Monitor:** A job that identifies and transitions bookings that have breached the 2-hour grace period without work commencement.

## 5. Detailed Sections

### 5.1 Job Inventory

#### 5.1.1 No-Show Detection Monitor
* **Purpose:** Enforces the "No-Show Results in Cancellation" rule by identifying stale appointments.
* **Trigger:** Scheduled hourly sweep.
* **Logic:** Scans for `scheduled` bookings where `current_time > start_time + 2 hours` and no `in_progress` state has been recorded.
* **Outputs:** State transition to `no_show`; triggering of the Request cancellation workflow.
* **Events Produced:** `booking.no_show`.
* **Audit Requirements:** Log the system-driven no-show declaration with the grace-period metadata.

#### 5.1.2 Booking Reminder Dispatcher
* **Purpose:** Proactively notifies Customers and Technicians of upcoming commitments.
* **Trigger:** Scheduled.
* **Frequency:** 24 hours and 3 hours before start time.
* **Inputs:** `scheduled` bookings within the 24-hour and 3-hour temporal windows.
* **Outputs:** Dispatched triggers to the Notification Point orchestrator.
* **Events Produced:** `booking.reminder_sent`.
* **Audit Requirements:** Log reminder dispatch event.

#### 5.1.3 Availability Cache Rebuilder
* **Purpose:** Ensures the "Availability Records" defined in the model design remain synchronized with real-time Working Hours and existing Bookings.
* **Trigger:** Event-driven (upon any booking mutation) or daily full sweep.
* **Inputs:** Technician Working Hours + Confirmed Booking windows.
* **Outputs:** Updated `Availability Record` entries.
* **Audit Requirements:** None (Operational state only).

### 5.2 Technical Expectations

* **Transactional Integrity:** Every job execution must wrap its mutations in an atomic transaction. State changes to `no_show` must be committed before triggering the parent Request cancellation.
* **Concurrency and Locking:** The **No-Show Monitor** must use `select_for_update(skip_locked=True)` to prevent multiple worker nodes from processing the same terminal transition simultaneously.
* **Idempotency:** Reminders must track `last_reminder_sent` timestamps to prevent duplicate notifications during overlapping job runs.
* **Retry Policy:** Failure to transition a Booking due to database locks should be retried with exponential backoff; failures due to business rule violations (e.g., Request already completed) should be discarded.

### 5.3 Alerting & Monitoring
* **SLA for Job Execution:** Any failure in the **No-Show Monitor** must emit a high-priority system alert to Staff for manual review, as it directly impacts the accuracy of the Request pipeline.

## 6. Dependencies
* `docs/workflows/no-show-policy.md`
* `docs/implementation/booking/booking-model-design.md`
* `docs/implementation/booking/booking-notification-points.md`

## 7. Open Questions
* None at this time.

## 8. Completion Criteria
* Background job requirements fully cover all time-based architectural rules.
* Transactional and locking strategies are defined to prevent race conditions during state mutations.
