# Verification flow

## Purpose

**Verification** proves that work met policy before a request reaches **completed**. It is a **control gate**, not a cosmetic step.

## Evidence

Typical evidence types (extensible in schema):

- Photos / files (virus scan and size limits per security policy)
- Checklist completion records
- Customer acknowledgement (where legal/product allows)

Evidence is **immutable** after approval except via **manager override** with audit.

## Roles

| Role | Capability |
|------|------------|
| Technician | Submit evidence package; cannot self-approve final verification |
| Staff | First-line review |
| Manager | Approve / reject / request rework; override with audit when permitted |

## Outcomes

- **Approve:** Transition to `completed`; notify customer and billing hooks if any.
- **Reject / rework:** Transition back to `in_progress` or intermediate state with **reason codes**; notify technician.

## Fraud and quality controls

- Timestamp and geolocation (if collected) are **advisory** inputs; decisions remain **human or policy-driven** unless future ML is explicitly approved and isolated.

## AI boundary

Automated or AI-assisted verification suggestions, if introduced, remain **advisory** and cannot **approve** operational completion without explicit human-controlled policy (see [ADR-003](../decisions/adr-003-ai-boundaries.md)).

## Related documentation

- [`request-lifecycle.md`](request-lifecycle.md)
- [`../architecture/auth.md`](../architecture/auth.md)
