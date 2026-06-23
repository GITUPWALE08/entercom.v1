# ADR-003: AI operational isolation

## Status

Accepted

## Context

The product includes an **AI support assistant**. Operational mistakes (wrong assignment, unauthorized status change, pricing manipulation) create **trust, safety, and compliance** risk. The assistant must improve UX without becoming a **privileged actor** in core workflows.

## Decision

Run the assistant as a **separate deployable** or a **strictly isolated** process and code boundary that:

- Reads **approved** knowledge and **authorized** user-visible context only.
- Returns **suggestions and explanations** — not authoritative operational commands.

**Prohibited:** controlling operational state, altering pricing, bypassing workflows, verification, or RBAC, or executing privileged tools without human approval (future tool-calling must enforce the same wall).

**Integration:** ingress via authenticated APIs; egress as **read-only responses**; any action on the core platform uses **normal human-driven services** or explicit non-AI automation — never silent AI mutation.

## Consequences

### Positive

- Clear **compliance narrative** and test surface (“AI cannot call X”).
- Safer **evolution** of tool-calling features behind explicit gates.

### Negative

- Some UX flows need **extra steps** (human confirmation) where AI might otherwise “do it in one shot.”
- Additional **deployment** or packaging complexity if fully separate service.

## Alternatives considered

1. **AI as first-class internal service with shared DB write access** — Rejected: blurs audit and authorization boundaries.
2. **Prompt-only safety (no architecture)** — Rejected: insufficient for production governance.
3. **Human-in-the-loop for all AI output** — Partially adopted as product policy where outputs influence customer-facing text; operational actions always require normal authorization paths.

## References

- Historical summary: moved from `AI_BOUNDARIES.md` into this ADR + [`../architecture/backend.md`](../architecture/backend.md#ai-and-payments)
- [`../architecture/auth.md`](../architecture/auth.md)
