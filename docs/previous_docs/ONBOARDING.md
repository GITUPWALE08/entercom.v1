# Developer onboarding

## Prerequisites

- Python 3.12+
- Node.js 20+
- Docker Desktop (for Postgres + Redis)
- Git

## 1. Clone and infrastructure

```bash
docker compose up -d
```

Copy environment templates:

```bash
cp backend/.env.example backend/.env
cp web/.env.example web/.env.local
cp mobile/.env.example mobile/.env
```

Point `backend/.env` `DATABASE_URL` at local Docker Postgres or Supabase.

## 2. Backend

The API uses a **custom user model** (`AUTH_USER_MODEL = users.User`): UUID primary key, email as the username field, required given name fields, coarse `UserRole` enum on the user row, and lifecycle/security columns for audit and future JWT/RBAC work. Run migrations after pulling.

```bash
cd backend
python -m venv .venv
# Windows: .venv\Scripts\activate
source .venv/bin/activate
pip install -r requirements/local.txt
python manage.py migrate
python manage.py runserver
```

ASGI (Channels) for local WebSockets:

```bash
uvicorn config.asgi:application --reload --host 0.0.0.0 --port 8000
```

Celery worker (optional local):

```bash
celery -A config worker -l info
```

## 3. Web

```bash
cd web
npm install
npm run dev
```

## 4. Mobile

```bash
cd mobile
npm install
npx expo start
```

## 5. Pre-commit (optional)

```bash
pip install pre-commit
pre-commit install
```

## API docs

- Swagger UI: `/api/v1/schema/swagger-ui/` (when `ENABLE_SPECTACULAR` is true in dev).

## Documentation index

See [`README.md`](README.md) for architecture, workflows, ADRs, and prompts.
