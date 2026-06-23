# ADR-001: Modular monolith for the API

## Status

Accepted

## Context

Entercom requires a production-grade operational platform (requests, bookings, chat, payments, notifications, RBAC) with **small team velocity** and **simple operations**. Early microservices would multiply deployment, observability, and transactional complexity without proven domain boundaries.

The stack is Django, DRF, Channels, PostgreSQL, Redis, and Celery — a **single deployable** fits natural Django strengths.

## Decision

Adopt a **modular monolith**: one Django codebase partitioned into **domain apps** under `backend/apps/`, each with models, repositories, services, permissions, and adapters (HTTP, WebSocket, tasks). Cross-domain work uses explicit **application services** in `backend/services/` or well-defined calls — **no** circular imports between domains.

## Consequences

### Positive

- **Faster delivery** for MVP and early iterations.
- **ACID transactions** across related aggregates remain straightforward.
- **One** CI pipeline, one runtime topology on Render (plus workers).
- **Clear extraction path** if a bounded context (for example AI) must become a separate service later.

### Negative

- Discipline required to avoid **accidental coupling** (imports “for convenience”).
- Scaling is **vertical-first** for the monolith; heavy CPU domains may later need worker isolation or extraction.

## Alternatives considered

1. **Microservices from day one** — Rejected: high coordination cost, distributed transactions, premature boundaries.
2. **Layer-only organization (no domain modules)** — Rejected: tends toward big-ball-of-mud; weak ownership of schemas and services.
3. **Serverless functions for API** — Rejected: poor fit for long-lived WebSockets, Celery-style workloads, and Django ORM-centric teams.

## References

- [`../architecture/backend.md`](../architecture/backend.md)
