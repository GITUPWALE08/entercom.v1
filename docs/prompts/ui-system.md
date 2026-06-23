---
version: "0.1"
last_reviewed: "2026-05-12"
owner: "engineering"
tags: ["ui", "design-system", "cursor"]
---

# UI system prompts

Use for **visual consistency** across web and mobile: typography, spacing, states, and accessibility.

## Prompt template

```markdown
You are a senior product engineer and UI designer.

Context:
- Stack: React + Tailwind (web), React Native + Expo (mobile)
- Shared tokens/components may live in shared-packages/design-system (when adopted)

Task:
- Align {FEATURE} with existing layout primitives and spacing scale
- Cover loading, empty, error, and success states
- Meet WCAG 2.1 AA for color contrast and focus order where applicable

Constraints:
- Do not change backend contracts unless explicitly requested
- Prefer composition over one-off CSS
```

## Versioning

Bump `version` when:

- Global token names change
- Navigation shell or route guard UX changes
- Breaking changes to shared components

## Related documentation

- [`../architecture/frontend.md`](../architecture/frontend.md)
