# Booking Implementation Index

## Purpose
This document serves to **Freeze Phase 4**. It acts as the single implementation authority index for the Booking Domain. The files listed below constitute the entirety of the approved architectural design, workflow logic, and implementation specifications.

## Approved Documents

### Architecture
* `docs/architecture/booking/booking-domain.md`
* `docs/architecture/booking/booking-glossary.md`
* `docs/architecture/booking/booking-services.md`
* `docs/architecture/booking/booking-state-machine.md`
* `docs/architecture/booking/booking-events.md`
* `docs/architecture/booking/booking-permissions.md`
* `docs/architecture/booking/booking-auditing.md`
* `docs/architecture/booking/booking-notification-points.md`
* `docs/architecture/booking/booking-data-ownership.md`

### Workflows
* `docs/workflows/booking-lifecycle.md`
* `docs/workflows/scheduling-flow.md`
* `docs/workflows/availability-policy.md`
* `docs/workflows/rescheduling-flow.md`
* `docs/workflows/calendar-policy.md`
* `docs/workflows/no-show-policy.md`
* `docs/workflows/booking-conflict-resolution.md`

### Implementation
* `docs/implementation/booking/booking-model-design.md`
* `docs/implementation/booking/booking-service-design.md`
* `docs/implementation/booking/booking-permission-mapping.md`
* `docs/implementation/booking/booking-api-design.md`
* `docs/implementation/booking/booking-event-contracts.md`
* `docs/implementation/booking/booking-audit-spec.md`
* `docs/implementation/booking/booking-background-jobs.md`
* `docs/implementation/booking/booking-websocket-spec.md`
* `docs/implementation/booking/booking-test-strategy.md`

## Final Authority Directive

**These documents are authoritative.** 

Implementation must not introduce new states, permissions, events, lifecycle transitions, ownership rules, APIs, or business logic not defined in these documents.
