# Deployment

## Targets

| Component | Platform | Notes |
|-----------|----------|-------|
| API + ASGI + Celery workers | **Render** | Web service + worker; Redis managed or Render Redis |
| Web SPA | **Vercel** | Build `web/`; env for `VITE_*` public config |
| Mobile | **Expo EAS** | `eas build` / `eas submit` |
| Database + file storage | **Supabase** | Postgres connection string; Storage buckets |

## Environment matrix

- **Development:** local Postgres/Redis via Docker Compose; optional Supabase dev project.
- **Staging:** mirrors production topology with separate Supabase project and Render preview.
- **Production:** secrets only in host env; no `.env` on disk.

## Migrations

- Run Django migrations in **release phase** on Render (or dedicated job) before traffic shifts.

## Observability (recommended next steps)

- Structured logging, error tracking (for example Sentry), and health endpoints — add in a later hardening pass.

## Related documentation

- [`architecture/backend.md`](architecture/backend.md) — deployment summary and topology rationale.
