# Entercom Unified Platform

Monorepo foundation for the Entercom Unified Platform MVP: modular monolith API (Django), web app (React), mobile apps (Expo), and shared TypeScript packages.

## Repository layout

| Path | Purpose |
|------|---------|
| `backend/` | Django + DRF + Channels + Celery API (Render in production) |
| `web/` | Customer-facing and staff web surfaces (Vercel) |
| `mobile/` | Technician and customer mobile shells (Expo EAS) |
| `shared-packages/` | Typed contracts, API client base, validation, tokens |
| `docs/` | Architecture, security, RBAC, deployment, onboarding |

This repository uses **one Git repository with four top-level project roots** so tooling, CI, and documentation stay aligned. Each subtree can be split into its own remote later if needed.

## Quick start (local)

1. **Infrastructure**: `docker compose up -d` (PostgreSQL + Redis for local dev). Production uses **Supabase** for PostgreSQL and Storage; point `DATABASE_URL` at Supabase when shared dev DB is required.

2. **Backend**: See [docs/architecture/backend.md](docs/architecture/backend..md).

3. **Web / Mobile**: See package READMEs in `web/` and `mobile/`, and if README is not available in web or mobile see [docs/architecture/frontend.md].

## Documentation index

- [Architecture](docs/architecture/) — modular monolith, layers, boundaries
- [RBAC](docs/architecture/auth.md) — permission-based roles and enforcement
- [Security](docs/architecture/auth.md) — JWT, CSRF, CORS, uploads, rate limits
- [WebSockets](docs/architecture/websocket.md) — channel naming, events, auth
- [AI boundaries](docs/decisions/adr-003-ai-boundaries.md) — isolated assistant service
- [Payments (future)](docs/architecture/payments.md) — Payment Provider (Paystack) webhook-first flow
- [Deployment](docs/DEPLOYMENT/) — Render, Vercel, EAS
- [Testing](docs/previous_doc/TESTING.md) — pytest, unit/API strategy
- [Onboarding](docs/previous_doc/ONBOARDING.md) — environment and day-one setup

## Engineering principles

- **Service layer** owns mutations and rules; views/serializers stay thin.
- **API versioning** under `/api/v1/`.
- **Backend-controlled** lifecycle and payment truth; frontend never finalizes operational state alone.
- **Strict TypeScript** on web and mobile; shared types where possible.

## License

Proprietary — All rights reserved.
