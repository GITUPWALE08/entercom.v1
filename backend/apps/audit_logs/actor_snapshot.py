"""Immutable actor attribution for forensic audit records."""

from __future__ import annotations

from typing import Any, Optional


def capture_actor_snapshot(actor: Any) -> dict[str, str]:
    if not actor or not getattr(actor, "is_authenticated", False):
        return {
            "actor_id": "",
            "actor_email": "",
            "actor_role": "",
        }

    actor_id = str(getattr(actor, "pk", "") or "")
    actor_email = str(getattr(actor, "email", "") or "")

    role_slugs: list[str] = []
    assignments = getattr(actor, "role_assignments", None)
    if assignments is not None:
        from django.utils import timezone
        from django.db.models import Q

        now = timezone.now()
        role_slugs = list(
            assignments.filter(is_active=True)
            .filter(Q(expires_at__isnull=True) | Q(expires_at__gt=now))
            .values_list("role__slug", flat=True)
            .distinct()
        )

    return {
        "actor_id": actor_id,
        "actor_email": actor_email,
        "actor_role": ",".join(sorted(role_slugs)),
    }
