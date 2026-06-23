"""Management command base classes with audit trace context."""

from __future__ import annotations

from django.core.management.base import BaseCommand

from core.trace_context import bind_standalone_trace, clear_trace_context


class AuditTraceCommand(BaseCommand):
    """
    Ensures management commands emit audit logs with request_id / correlation_id.
    """

    def execute(self, *args, **options):
        bind_standalone_trace()
        try:
            return super().execute(*args, **options)
        finally:
            clear_trace_context()
