# ADR-002: REST (versioned) as primary client API

## Status

Accepted

## Context

Clients include a React SPA, React Native (Expo), and potential third-party integrations. The team needs **predictable caching**, **simple debugging**, and **OpenAPI**-driven contracts. Realtime needs are **narrow** (chat, notifications, request status) and already served by WebSockets.

## Decision

Use **REST** under **`/api/v1/`** as the **primary** application API. Generate and publish **OpenAPI** (drf-spectacular) for contract documentation. Use **WebSockets only** for the scoped realtime domains documented in ADR-adjacent websocket docs — not as a general-purpose query surface.

## Consequences

### Positive

- Mature tooling (HTTP caches, proxies, CDNs for static GETs where safe).
- Straightforward **permission mapping** per route with DRF.
- **Typed client** generation path from OpenAPI for web/mobile alignment.

### Negative

- Clients may require **multiple requests** for graphs of data (mitigate with intentional aggregates or pagination patterns — not GraphQL ad hoc fields).
- Versioning requires **discipline** when introducing breaking changes (`v2` parallel include).

## Alternatives considered

1. **GraphQL** — Rejected for MVP: adds schema governance, N+1 risk, and weaker default HTTP semantics for the current team and product shape.
2. **gRPC internal + REST external** — Deferred: useful if many internal services exist; not justified inside a monolith today.
3. **JSON:API everywhere** — Optional profile; not mandated unless client libraries standardize on it.

## References

- [`../architecture/backend.md`](../architecture/backend.md)
- [`../architecture/websocket.md`](../architecture/websocket.md)
