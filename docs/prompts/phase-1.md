---
version: "1.0"
last_reviewed: "2026-05-12"
owner: "engineering"
tags: ["architecture", "foundation", "cursor"]
---

# Phase 1 — Foundation architecture prompt

Use when bootstrapping or extending **repository foundation** only (no domain workflows).

## Prompt

```text
You are a senior software architect and lead backend engineer.

Your task is to generate the COMPLETE repository architecture and project foundation for a production-grade MVP called "Entercom Unified Platform".

IMPORTANT:
This phase is ONLY for:
- repository setup
- architecture foundation
- project structure
- environment setup
- shared engineering standards
- backend initialization
- frontend initialization
- CI-ready structure
- developer experience setup

DO NOT implement business logic yet.
DO NOT implement request workflows yet.
DO NOT implement AI logic yet.
DO NOT implement payment logic yet.

This phase is strictly architectural foundation only.

====================================================
PROJECT OVERVIEW
====================================================

The platform is a centralized operational system for:
- customers
- staff
- managers
- technicians

The MVP includes:
- customer app
- technician app
- admin dashboard
- support chat
- AI assistant
- service requests
- product ordering
- payments
- notifications
- realtime updates

BUT THIS PHASE MUST ONLY SET UP THE FOUNDATION.

====================================================
TECH STACK
====================================================

BACKEND:
- Django
- Django REST Framework
- Django Channels
- PostgreSQL
- Redis
- Celery

DATABASE:
- PostgreSQL via Supabase

FRONTEND WEB:
- React
- TypeScript
- TailwindCSS
- React Query
- Zustand

MOBILE:
- React Native
- Expo
- TypeScript
- Expo Router
- Zustand

DEPLOYMENT:
- Backend → Render
- Web → Vercel
- Mobile → Expo EAS

AUTH:
- JWT authentication
- rotating refresh tokens
- revoke on logout

FILE STORAGE:
- Supabase Storage

REALTIME:
- Django Channels WebSockets

PAYMENTS:
- Payment Provider (future phase)

AI:
- separate isolated support assistant service

====================================================
ARCHITECTURE REQUIREMENTS
====================================================

The system MUST follow:
- modular monolith architecture
- service-layer architecture
- strict separation of concerns
- backend-controlled business logic
- API versioning
- permission-based RBAC

NEVER:
- place business logic in views
- place business logic in serializers
- tightly couple modules
- allow frontend-controlled status changes

====================================================
REPOSITORY STRUCTURE
====================================================

Generate the FULL repository structure.

The architecture must use SEPARATE repositories:

1. backend/
2. web/
3. mobile/
4. shared-packages/

====================================================
BACKEND REQUIREMENTS
====================================================

Generate a production-grade Django structure.

Use modular Django apps.

Suggested architecture:

backend/
├── apps/
│   ├── authentication/
│   ├── users/
│   ├── roles/
│   ├── requests/
│   ├── bookings/
│   ├── notifications/
│   ├── chat/
│   ├── ai_support/
│   ├── products/
│   ├── orders/
│   ├── payments/
│   ├── analytics/
│   ├── audit_logs/
│   ├── technicians/
│   ├── websocket/
│   └── common/
│
├── config/
├── core/
├── services/
├── utils/
├── tests/
└── requirements/

Each module must support:
- models
- serializers
- views
- services
- repositories
- permissions
- urls
- tests

Generate:
- settings architecture
- environment separation
- production/dev settings
- logging configuration
- Celery setup
- Redis setup
- Channels setup
- JWT setup
- Docker setup
- environment variable strategy

====================================================
FRONTEND WEB REQUIREMENTS
====================================================

Generate production-ready React architecture.

Use:
- feature-based folder structure
- TypeScript strict mode
- React Query
- Zustand
- TailwindCSS

Suggested architecture:

web/
├── src/
│   ├── app/
│   ├── features/
│   ├── components/
│   ├── services/
│   ├── hooks/
│   ├── store/
│   ├── layouts/
│   ├── routes/
│   ├── utils/
│   ├── types/
│   └── styles/

Generate:
- routing structure
- protected route strategy
- API layer structure
- websocket abstraction structure
- state management strategy
- environment config
- error boundary structure
- loading state architecture

====================================================
MOBILE REQUIREMENTS
====================================================

Generate Expo React Native architecture.

Use:
- Expo Router
- Zustand
- React Query
- TypeScript strict mode

Suggested structure:

mobile/
├── app/
├── features/
├── components/
├── hooks/
├── services/
├── store/
├── utils/
├── types/
├── offline/
└── websocket/

The mobile app MUST support:
- temporary offline usage
- cached assigned jobs
- offline notes draft
- later synchronization

DO NOT implement full offline-first architecture.

Only:
- local draft persistence
- cached job viewing

Generate:
- offline sync architecture plan
- websocket architecture
- notification setup structure
- route structure
- navigation architecture

====================================================
SHARED PACKAGES REQUIREMENTS
====================================================

Generate architecture for:

shared-packages/
├── types/
├── api-client/
├── validation/
├── utils/
└── design-system/

====================================================
RBAC REQUIREMENTS
====================================================

The system MUST use:
permission-based RBAC.

Roles include:
- customer
- technician
- staff
- manager
- superadmin

Generate:
- RBAC architecture
- permission hierarchy
- permission enforcement strategy
- backend authorization architecture

====================================================
REQUEST SYSTEM RULES
====================================================

DO NOT IMPLEMENT THE REQUEST SYSTEM YET.

But architecture must prepare for:
- strict request lifecycle transitions
- audit logging
- assignment tracking
- verification workflows

====================================================
WEBSOCKET REQUIREMENTS
====================================================

WebSockets are ONLY for:
- support chat
- notifications
- request status updates

DO NOT websocket everything.

Generate:
- websocket event architecture
- websocket naming conventions
- channel separation strategy

====================================================
AI SYSTEM RULES
====================================================

AI is ONLY:
- support assistant
- FAQ assistant
- guidance assistant

AI MUST NOT:
- control operations
- assign technicians
- alter pricing
- bypass workflows

Generate:
- isolated AI service architecture
- AI boundary documentation

====================================================
PAYMENT ARCHITECTURE REQUIREMENTS
====================================================

DO NOT IMPLEMENT PAYMENTS YET.

But architecture must support:

Payment Provider flow:
User pays
→ webhook hits Django
→ backend verifies signature
→ DB updates
→ frontend reflects status

NEVER trust frontend payment success.

====================================================
SECURITY REQUIREMENTS
====================================================

Generate security architecture for:
- JWT auth
- refresh token rotation
- token revocation
- role-based access
- upload validation
- websocket auth
- rate limiting
- API throttling
- CORS
- CSRF strategy
- secure environment variables

====================================================
TESTING REQUIREMENTS
====================================================

Generate:
- unit test architecture
- API testing strategy
- pytest setup
- test folder structure

DO NOT generate integration tests yet.

====================================================
DOCUMENTATION REQUIREMENTS
====================================================

Generate:
- README structure
- architecture documentation
- API documentation strategy
- Swagger/OpenAPI setup
- onboarding documentation

====================================================
DEVOPS REQUIREMENTS
====================================================

Generate:
- Docker setup
- docker-compose
- environment variable templates
- CI-ready structure
- linting setup
- formatting setup
- pre-commit hooks

====================================================
IMPORTANT ENGINEERING RULES
====================================================

STRICTLY FOLLOW THESE RULES:

1. Use clean architecture principles.
2. Use service-layer architecture.
3. Avoid circular dependencies.
4. Keep modules loosely coupled.
5. Use backend-controlled business logic.
6. Use typed APIs everywhere.
7. Use strict TypeScript mode.
8. Use environment-based configuration.
9. Keep the architecture scalable but MVP-friendly.
10. Avoid premature optimization.
11. Avoid microservices.
12. Avoid overengineering.
13. Use modular monolith architecture.
14. Keep AI isolated from operational logic.
15. Keep request lifecycle centralized.
16. Prepare architecture for future scaling.
17. Optimize for maintainability over cleverness.

====================================================
OUTPUT REQUIREMENTS
====================================================

Generate:
1. Complete repository structures
2. Backend architecture plan
3. Frontend architecture plan
4. Mobile architecture plan
5. Shared package architecture
6. Environment setup
7. Docker setup
8. Dependency recommendations
9. State management architecture
10. WebSocket architecture
11. RBAC architecture
12. Security architecture
13. Testing architecture
14. Documentation architecture
15. Deployment architecture
16. Folder-by-folder explanations
17. Engineering rationale for major decisions

DO NOT:
- generate business logic
- generate request workflow implementation
- generate payment implementation
- generate AI implementation

ONLY generate the foundation architecture.
```

## Changelog

| Version | Change |
|---------|--------|
| 1.0 | Migrated from `docs/AI PROMPT/phase 1.txt` into markdown with front matter |
