# Prompt library

Canonical storage for **reusable** prompts (Cursor, implementation, architecture, UI, testing).

## Conventions

| Item | Rule |
|------|------|
| **Filename** | `kebab-case.md`; phases use `phase-N.md` |
| **Front matter** | `version`, `last_reviewed`, `owner`, `tags` (optional `supersedes`) |
| **Breaking changes** | Bump `version`; note delta in **Changelog** section |

## Index

| File | Purpose |
|------|---------|
| [phase-1.md](phase-1.md) | Repository and foundation architecture (no business logic) |
| [phase-2.md](phase-2.md) | Feature implementation phase prompts (skeleton) |
| [ui-system.md](ui-system.md) | UI / design-system alignment prompts |

Legacy path: `docs/AI PROMPT/` — see [../AI%20PROMPT/README.md](../AI%20PROMPT/README.md) if present.
