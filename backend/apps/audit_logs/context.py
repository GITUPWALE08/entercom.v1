"""Thread-safe gate for append-only audit creation."""

from __future__ import annotations

from contextlib import contextmanager
from contextvars import ContextVar

_audit_create_allowed: ContextVar[bool] = ContextVar("audit_create_allowed", default=False)

maintenance_ctx = ContextVar(
    "audit_maintenance",
    default=False
)

def is_audit_create_allowed() -> bool:
    return _audit_create_allowed.get()


@contextmanager
def allow_audit_create():
    token = _audit_create_allowed.set(True)
    try:
        yield
    finally:
        _audit_create_allowed.reset(token)
