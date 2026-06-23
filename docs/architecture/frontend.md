# Frontend architecture

## Surfaces

| Surface | Stack | Notes |
|---------|-------|-------|
| Customer / staff web | React, TypeScript, Tailwind | Feature-oriented layout under `web/src/` |
| Technician / customer mobile | React Native, Expo, Expo Router | Offline-tolerant patterns; see [offline-sync.md](offline-sync.md) |

## Architectural principles

- **Backend-controlled state** — Operational transitions and payment truth come from the API (and webhooks), not optimistic UI-only state machines for authoritative data.
- **Typed contracts** — TypeScript `strict`; align types with OpenAPI / shared packages where possible.
- **Single WebSocket client** — One abstraction per platform parsing the same [event envelope](websocket.md#event-envelope); reconnect and subscribe helpers colocated (`web/src/services/websocket/`, `mobile/websocket/`).

## Shared packages

TypeScript packages in `shared-packages/` hold **DTO-shaped types**, **validation schemas**, and a thin **API client** so web and mobile do not diverge on contracts.

Suggested layout (evolutionary):

- `types/` — shared interfaces aligned with API.
- `api-client/` — HTTP client, versioning base path.
- `validation/` — Zod (or chosen) schemas mirroring backend validation shape.
- `utils/` — shared non-UI helpers.
- `design-system/` — tokens and primitives if extracted.

## State and data fetching

- **Server state:** React Query (TanStack Query) for caching, retries, and invalidation after mutations.
- **Client UI state:** Zustand (or minimal local state) for navigation and ephemeral UI — not as the source of truth for workflow state.

## Routing and access

- Protected routes gate on **authenticated session** and **permission-aware** route guards (derive from RBAC claims or permission API).
- Error boundaries at app shell and critical feature boundaries; consistent loading and empty states per feature.

## Related documentation

- [auth.md](auth.md) — JWT usage and permission checks on the client (display vs enforce: server always enforces).
- [websocket.md](websocket.md) — namespaces relevant to web and mobile.
- [../onboarding.md](../onboarding.md) — local dev commands for web and mobile.
