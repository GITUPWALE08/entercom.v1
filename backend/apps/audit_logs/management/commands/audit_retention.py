"""Enforce audit retention policy (7-year security, 1-year general)."""

from __future__ import annotations

from apps.audit_logs.services.retention_service import run_retention
from core.management.base import AuditTraceCommand


class Command(AuditTraceCommand):
    help = (
        "Enforce audit retention: archive security logs after 7 years, "
        "purge general logs after 1 year (respects legal_hold)."
    )

    def add_arguments(self, parser):
        parser.add_argument(
            "--dry-run",
            action="store_true",
            help="Report counts without modifying data.",
        )

    def handle(self, *args, **options):
        summary = run_retention(dry_run=options["dry_run"])
        self.stdout.write(self.style.SUCCESS(str(summary)))
