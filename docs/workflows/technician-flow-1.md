# Technician workflow

## Goals

- Technicians see **assigned** work, progress jobs through validated transitions, and submit **verification** artifacts.
- Mobile supports **temporary offline** viewing and draft notes ([`../architecture/offline-sync.md`](../architecture/offline-sync.md)).

## Typical sequence

1. **Assignment notification** — Push / in-app / WebSocket per configuration.
2. **Accept or decline** (if modeled) — Server decision; race-safe assignment service.
3. **In progress** — Checklists, notes, photos; uploads validated server-side.
4. **Submit for verification** — Moves request to `pending_verification` when coupled to requests ([`request-lifecycle.md`](request-lifecycle.md)).

## Permissions

- Technicians hold narrow permissions (`requests.view_assigned`, field update permissions); they **cannot** bypass manager-only transitions.

## Offline behavior

- Cached job list and drafts; sync on reconnect; server **rejects** illegal transitions with clear errors for UI replay.

## Escalation

- Technician can flag **blocked** or **escalate**; service records reason and notifies staff/manager per escalation policy ([`request-lifecycle.md`](request-lifecycle.md#escalation-logic)).

## Related documentation

- [`verification-flow.md`](verification-flow.md)
- [`../architecture/auth.md`](../architecture/auth.md)
