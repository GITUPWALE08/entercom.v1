# AGENTS — AI assistant guidance for this repo

Purpose: give AI coding agents the minimal, high-value context they need to be productive in this repository.

Quick facts
- **Stack:** Django backend ([backend/manage.py](backend/manage.py), [backend/pyproject.toml](backend/pyproject.toml)); Web frontend ([web/package.json](web/package.json), [web/src](web/src)); Mobile app ([mobile/package.json](mobile/package.json)).
- **Monorepo layout:** backend code lives under `backend/apps/` (Django apps). Docs and architecture notes live under `docs/` and `docs/architecture/`.

Dev & test commands (confirm locally before running)
- **Services:** [docker-compose.yml](docker-compose.yml) defines local services.
- **Start backend (dev):** `cd backend && python manage.py runserver` (see [backend/manage.py](backend/manage.py)).
- **Backend tests:** run `pytest` from the `backend/` folder (config: [backend/pytest.ini](backend/pytest.ini)). Also more detailed testing for each application should be written in apps/*/tests, and integration and coupling tests should be in backend/tests/*. 
- **Web dev:** `cd web && npm install && npm run dev` (see [web/package.json](web/package.json)).

Where to look for common tasks
- **Architecture & design decisions:** [docs/architecture/](docs/architecture/) and [docs/decisions/](docs/decisions/).
- **Onboarding / deployment notes:** [deployment/DEPLOYMENT.md](deployment/DEPLOYMENT.md) and [deployment/ONBOARDING.md](deployment/ONBOARDING.md).
- **Prompts & AI notes:** [docs/AI PROMPT/README.md](docs/AI%20PROMPT/README.md) and [docs/prompts/](docs/prompts/).

Agent behavior guidelines
- **Link, don't embed:** Prefer linking to existing docs instead of copying long text.
- **Minimal edits:** Make focused, small changes; run tests where feasible; seek clarification for changes affecting infra or security.
- **Preserve conventions:** Follow Django app structure in `backend/apps/` and existing tests; prefer existing coding patterns over style rewrites.
- **Don't assume secrets:** Never hardcode credentials or tokens; surface missing env/config notes to the user.
- **You're Implementing:** Only refer to referenced from the prompt and do not try to generate new design, just follow the already design and documents

- **You're not a blind follower:** Avoid over implementation if self auditing while implementing/fixing code will cause another bug/problem, if you encounter any problem while implementing you can stop and
  let me know so I can help you fix, do not blindly operate just so you can give me a pleasing reply, always be strict and straightforward.
