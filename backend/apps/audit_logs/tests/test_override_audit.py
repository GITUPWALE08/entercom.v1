import pytest
from django.contrib.auth import get_user_model
from apps.audit_logs.services.security_audit import log_override_used
from apps.audit_logs.models import AuditLogEntry

User = get_user_model()

@pytest.fixture
def user():
    return User.objects.create(email="user1@example.com")

@pytest.mark.django_db
def test_override_audit_logging(user):
    entry = log_override_used(
        actor=user,
        actor_role="admin",
        reason="System down",
        target_resource="db-cluster",
        justification="urgent fix",
        approval_chain="manager_123"
    )
    
    assert entry is not None
    assert entry.action == "security.override_used"
    assert entry.metadata["actor_role"] == "admin"
    assert entry.metadata["target_resource"] == "db-cluster"
    assert entry.metadata["justification"] == "urgent fix"
    assert entry.metadata["approval_chain"] == "manager_123"
    assert entry.metadata["critical"] is True
