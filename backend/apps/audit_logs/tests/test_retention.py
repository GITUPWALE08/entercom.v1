import pytest
from django.contrib.auth import get_user_model
from django.utils import timezone
from datetime import timedelta
from unittest.mock import patch

from apps.audit_logs.models import AuditLogEntry, AuditRetentionClass
from apps.audit_logs.services.audit_service import log_action
from apps.audit_logs.services.retention_service import run_retention

User = get_user_model()

@pytest.mark.django_db
class TestRetentionEnforcement:
    def test_security_entries_archived_after_retention_window(self):
        user = User.objects.create(email="ret-sec@example.com")
        past_time = timezone.now() - timedelta(days=8 * 365)
        with patch('django.utils.timezone.now', return_value=past_time):
            entry = log_action(action="auth.login_success", actor=user)
        
        summary = run_retention(dry_run=False)
        entry.refresh_from_db()
        assert summary["security_archived"] >= 1
        assert entry.archived_at is not None

    def test_general_entries_marked_or_purged(self):
        user = User.objects.create(email="ret-gen@example.com")
        past_time = timezone.now() - timedelta(days=400)
        with patch('django.utils.timezone.now', return_value=past_time):
            entry = log_action(
                action="rbac.cache_invalidated",
                resource_type="user",
                resource_id=str(user.id),
                retention_class=AuditRetentionClass.GENERAL
            )
            
        summary = run_retention(dry_run=False)
        assert summary["general_purged"] >= 1

    def test_legal_hold_prevents_purge(self):
        user = User.objects.create(email="hold@example.com")
        past_time = timezone.now() - timedelta(days=400)
        with patch('django.utils.timezone.now', return_value=past_time):
            entry = log_action(
                action="rbac.cache_invalidated",
                resource_type="user",
                resource_id=str(user.id),
                legal_hold=True,
                retention_class=AuditRetentionClass.GENERAL
            )
            
        run_retention(dry_run=False)
        assert AuditLogEntry.objects.filter(pk=entry.pk).exists()
