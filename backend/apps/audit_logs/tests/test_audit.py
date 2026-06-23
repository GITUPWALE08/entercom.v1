import pytest
from django.contrib.auth import get_user_model
from apps.audit_logs.models import AuditLogEntry
from apps.audit_logs.services.audit_service import log_action, log_permission_denial
from core.middleware.request_id import request_id_ctx, correlation_id_ctx

User = get_user_model()

@pytest.fixture
def user():
    return User.objects.create(email="auditor@example.com", first_name="Audit", last_name="User")

@pytest.mark.django_db
class TestAuditLogging:
    def test_log_action_captures_context(self, user):
        # Set context manually as if middleware did it
        request_id_ctx.set("req-123")
        correlation_id_ctx.set("corr-456")
        
        entry = log_action(
            action="test.action",
            actor=user,
            resource_type="test_resource",
            resource_id="res-789",
            reason="Testing audit logs",
            metadata={"key": "value"}
        )
        
        assert entry.action == "test.action"
        assert entry.actor == user
        assert entry.request_id == "req-123"
        assert entry.correlation_id == "corr-456"
        assert entry.resource_type == "test_resource"
        assert entry.resource_id == "res-789"
        assert entry.reason == "Testing audit logs"
        assert entry.metadata == {"key": "value"}
        
        # Verify immutability via str
        assert "auditor@example.com" in str(entry)
        assert "test.action" in str(entry)

    def test_log_permission_denial(self, user):
        entry = log_permission_denial(
            actor=user,
            permission_codename="request.cancel_started",
            resource_id="req-uuid"
        )
        
        assert entry.action == "security.permission_denied"
        assert entry.actor == user
        assert "request.cancel_started" in entry.reason
        assert entry.metadata["permission_codename"] == "request.cancel_started"

    def test_immutable_admin_logic(self):
        from apps.audit_logs.admin import AuditLogEntryAdmin
        from django.contrib.admin import AdminSite

        admin = AuditLogEntryAdmin(AuditLogEntry, AdminSite())
        assert admin.has_add_permission(None) is False
        assert admin.has_change_permission(None) is False
        assert admin.has_delete_permission(None) is False

    def test_critical_log_action_raises_on_failure(self, user, monkeypatch):
        from apps.audit_logs.exceptions import AuditFailureError

        def boom(**kwargs):
            raise RuntimeError("audit db unavailable")

        monkeypatch.setattr(
            "apps.audit_logs.services.audit_service.AuditLogEntry.objects.create",
            boom,
        )
        with pytest.raises(AuditFailureError):
            log_action(action="roles.test", actor=user)
