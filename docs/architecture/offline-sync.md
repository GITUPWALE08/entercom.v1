# Offline sync strategy (technician mobile)

## Positioning

The platform targets **temporary offline usage** for technicians: viewing cached assignments, capturing **draft** notes, and **later synchronization** when connectivity returns. This is **not** a full offline-first CRDT system in the MVP phase.

## Client responsibilities

| Concern | Approach |
|---------|----------|
| Cached assigned jobs | Read-through cache from last successful fetch; show stale indicators |
| Offline notes | Persist drafts locally (AsyncStorage or similar); conflict policy: **last-write-wins** or **server wins** — document chosen policy per field when implemented |
| Mutations while offline | Queue with explicit user feedback; **retry** on reconnect; **idempotent** server APIs where possible |

## Server responsibilities

- **Authoritative state** remains on the server; reconnect sync **pulls truth** then reconciles local queue.
- Sensitive transitions (verification, assignment acceptance) remain **server-gated**; offline UI should not imply completion until acknowledged.

## WebSocket interaction

- On reconnect, **re-subscribe** to relevant groups ([websocket.md](websocket.md)) and **refetch** critical aggregates via REST to heal drift.

## Security

- Cached payloads may contain PII — use **OS-level storage** protections and clear cache on logout where feasible.

## Related documentation

- [frontend.md](frontend.md) — mobile structure and `offline/` directory intent.
- [../workflows/technician-flow.md](../workflows/technician-flow.md) — when sync and verification interact.
