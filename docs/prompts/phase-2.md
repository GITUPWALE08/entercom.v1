---
version: "0.1"
last_reviewed: "2026-05-12"
owner: "engineering"
tags: ["implementation", "features", "cursor"]
---

# Phase 2 — Feature implementation prompts (skeleton)

Use **after** foundation exists. Split concrete prompts by domain (requests, bookings, chat, payments) to keep context windows focused.

## Template for new feature prompts

```markdown
## Goal
One sentence outcome.

## Scope
- In: ...
- Out: ...

## Preconditions
- Services / models that must exist
- Permissions required

## Acceptance criteria
- API contracts (link OpenAPI paths)
- Workflow transitions (link docs/workflows/*.md)
- Tests (unit vs API)

## Non-goals
Explicit exclusions to prevent scope creep.

## Safety
- RBAC checks (service + DRF)
- Audit events
- Idempotency keys where needed
```

## Suggested prompt files (add as needed)

| File (future) | Intent |
|----------------|--------|
| `requests-domain.md` | Service request CRUD and transitions |
| `bookings-domain.md` | Slot holds and confirmation |
| `chat-support.md` | Thread model and WS events |
| `payments-provider.md` | Webhook handler and reconciliation hooks |

## Changelog

| Version | Change |
|---------|--------|
| 0.1 | Skeleton and template for Phase 2 prompt split |

