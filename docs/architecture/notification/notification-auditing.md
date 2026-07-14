# Notification Auditing Architecture

## Purpose
The purpose of this document is to define the auditing requirements and integration points for the Notification Domain. It ensures that system and administrative interactions with notifications are securely logged for compliance, troubleshooting, and historical traceability.

## Scope
- Administrative actions taken on notifications (e.g., manual re-dispatch).
- System-level delivery state transitions (e.g., logging a permanent failure).
- User preference modifications.
- Interactions between the Notification Domain and the central Audit Domain.

## Out of Scope
- Auditing the core business events that *triggered* the notification (this is the responsibility of the origin domain, e.g., the Request Domain logging `RequestEscalated`).
- The internal storage mechanisms of the Audit Domain.

## Definitions
- **Administrative Action**: Any manual intervention performed by an admin-level user on the notification dispatch pipeline.
- **Delivery Audit Log**: A specialized log entry capturing the terminal failure or success of a critical notification attempt, ensuring non-repudiation of delivery.

## Architecture

### Auditable Events
The Notification Domain must actively publish events to the central Audit Domain for the following categories:

1. **Preference Mutations**:
   - When a user or an admin alters a notification preference (Opt-In / Opt-Out).
   - *Reason*: Compliance and debugging. If a user claims they did not receive an email, the audit log must definitively prove whether they had opted out prior to the event.

2. **Delivery Failures**:
   - When a notification transitions to the `Dead-Lettered` state.
   - *Reason*: Platform health monitoring and SLA enforcement. Provides a historical record of unresolvable provider or network failures.

3. **Administrative Interventions**:
   - When an admin manually re-queues a failed notification.
   - When an admin inspects a user's notification delivery history.
   - *Reason*: Security and accountability. Ensures admins do not abuse their global visibility.

### Audit Payload Contract
When the Notification Domain emits an auditable event, it must include:
- `actor_id`: The ID of the user/admin taking the action (or "SYSTEM" for automated delivery failures).
- `resource_id`: The ID of the affected Notification or Preference record.
- `action_type`: E.g., `preference_updated`, `delivery_dead_lettered`, `notification_requeued`.
- `metadata`: Relevant contextual data (e.g., previous preference state, new preference state, or the provider's HTTP error code).

## Responsibilities
- **Notification Domain**: Identify auditable actions and format them into the standard outbound event contract expected by the Audit Domain.
- **Audit Domain**: Ingest, immutably store, and provide query interfaces for the emitted notification audit logs.

## Dependencies
- **Audit Domain**: The central repository for all platform audit logs.

## Open Questions
All business and technical decisions have been resolved:

**Question:** Should every Read transition be audited?
**Decision:** No.

Read events belong to notification analytics rather than immutable audit logs.

Read state changes shall be stored in the notification database but SHALL NOT generate immutable audit events.

Rationale:
Read events are extremely high-volume and provide little security value.

Impact:
Notification Analytics
Notification Storage

## Completion Criteria
- All required auditable actions within the Notification Domain are explicitly identified.
- The boundary and contract for sending these logs to the Audit Domain is defined.
