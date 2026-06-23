# Testing architecture

## Backend

- **Runner:** `pytest` + `pytest-django`.
- **Layout:**
  - `backend/tests/unit/` — pure functions, service logic (future).
  - `backend/tests/api/` — API tests using DRF APIClient (no broad integration suite in early phases).
  - Per-app `apps/*/tests/` — colocated tests optional for small modules.

## Policy (early phases)

- **Unit** and **focused API** tests are in scope.
- **Full integration / e2e** tests are **out of scope** until core workflows stabilize.

## Frontend

- **Web:** Vitest (optional activation), ESLint, TypeScript `strict`.
- **Mobile:** ESLint, TypeScript `strict`; Detox/e2e later.

## CI

See `.github/workflows/ci.yml` for lint and test gates.

## Prompts

Add reusable test-generation prompts under [`prompts/`](prompts/) (for example `testing-api.md`) when patterns repeat.
