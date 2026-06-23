# Entercom Unified Platform — Documentation

This directory is the **canonical engineering knowledge base** for the platform. Prefer links here over tribal knowledge in chat.

## Documentation map

| Area | Path | Purpose |
|------|------|---------|
| System architecture | [`architecture/`](architecture/) | Backend, frontend, realtime, auth, payments, notifications, offline |
| Operational workflows | [`workflows/`](workflows/) | Request, booking, technician, verification lifecycles |
| Prompt library | [`prompts/`](prompts/) | Cursor and implementation prompts (versioned) |
| Architecture decisions | [`decisions/`](decisions/) | ADRs — context, decision, consequences |

### Companion guides (outside strict subtree)

| Topic | Path |
|-------|------|
| Developer setup | [`onboarding.md`](onboarding.md) |
| Test strategy | [`testing.md`](testing.md) |
| Host and release topology | [`deployment.md`](deployment.md) |

### Legacy entry points

Older uppercase filenames redirect here to avoid duplicate maintenance:

- `ARCHITECTURE.md` → [`architecture/backend.md`](architecture/backend.md) (overview) + siblings
- `WEBSOCKETS.md` → [`architecture/websocket.md`](architecture/websocket.md)
- `RBAC.md` / `SECURITY.md` → [`architecture/auth.md`](architecture/auth.md)
- `PAYMENTS.md` → [`architecture/payments.md`](architecture/payments.md)
- `AI_BOUNDARIES.md` → [`decisions/adr-003-ai-boundaries.md`](decisions/adr-003-ai-boundaries.md) + [`architecture/backend.md`](architecture/backend.md#ai-and-payments) summary

## Engineering standards (summary)

1. **Single source of truth** — Domain behavior lives in backend **services**, not views or serializers alone.
2. **Contracts** — REST under `/api/v1/`; OpenAPI where enabled; shared DTOs in `shared-packages/`.
3. **Realtime boundaries** — WebSockets only for chat, notifications, and request status (see [`architecture/websocket.md`](architecture/websocket.md)).
4. **AI isolation** — Advisory only; no operational control (see ADR-003).
5. **ADRs** — Significant structural choices get an ADR in [`decisions/`](decisions/).

For naming, prompts, and ADR templates, see sections **Naming**, **Prompts**, and **ADRs** at the end of this file.

---

## Naming conventions

| Artifact | Convention | Example |
|----------|------------|---------|
| Doc files | `kebab-case.md` | `request-lifecycle.md` |
| ADRs | `adr-{NNN}-{slug}.md` | `adr-001-modular-monolith.md` |
| Permission codenames | `{domain}.{action}` or `{domain}.{resource}.{action}` | `requests.assign` |
| WebSocket events | Stable dot-separated names | `requests.status_changed` |
| Prompt files | Phase or concern + optional version suffix in front matter | `phase-1.md` |

## Prompt documentation strategy

- **Location**: [`prompts/`](prompts/) is the permanent store for reusable prompts (Cursor, implementation, architecture, UI, testing).
- **Versioning**: Use YAML front matter (`version`, `last_reviewed`, `owner`) on each prompt file; bump `version` on breaking instruction changes.
- **Categorization**: By **phase** (foundation vs feature) and by **concern** (UI system, testing); cross-link from `README.md` index tables.
- **Naming**: `phase-*`, `ui-system`, or `{domain}-{intent}.md` for ad-hoc prompts; avoid spaces in filenames (replace `AI PROMPT/phase 1.txt` style with `prompts/phase-1.md`).

## ADR process

1. Create `decisions/adr-NNN-short-title.md` using the template in [`decisions/README.md`](decisions/README.md) (if present) or any existing ADR.
2. One decision per ADR; link related ADRs in **Context**.
3. When superseded, add **Supersedes** / **Superseded by** headers; do not delete history.

## Suggested repository README (root)

The repository root `README.md` should:

1. One-paragraph product description and audience (customer, technician, staff, manager, superadmin).
2. Link to **`docs/README.md`** as the documentation entry.
3. Quick start: link to [`docs/onboarding.md`](onboarding.md).
4. Tech stack line (Django, DRF, Channels, Postgres, Redis, Celery, React, RN/Expo, Tailwind, Supabase, Render, Vercel).
5. License / contribution pointer (if applicable).

Keep root README short; deep detail stays under `docs/`.
