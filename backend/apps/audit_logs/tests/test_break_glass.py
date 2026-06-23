import pytest
from django.contrib.auth import get_user_model
from apps.audit_logs.services.security_audit import log_break_glass, log_emergency_access
from apps.audit_logs.models import AuditLogEntry

User = get_user_model()

@pytest.fixture
def user():
    return User.objects.create(email="user2@example.com")

@pytest.mark.django_db
def test_break_glass_logging(user):
    entry = log_break_glass(
        actor=user,
        actor_role="sysadmin",
        reason="datacenter outage",
        target_resource="primary-dc",
        justification="no other way",
        approval_chain="ceo_approval"
    )
    
    assert entry is not None
    assert entry.action == "security.break_glass"
    assert entry.metadata["critical"] is True


@pytest.mark.django_db
def test_emergency_access_logging(user):
    entry = log_emergency_access(
        actor=user,
        actor_role="sysadmin",
        reason="datacenter outage",
        target_resource="primary-dc",
        justification="no other way",
        approval_chain="ceo_approval"
    )
    
    assert entry is not None
    assert entry.action == "security.emergency_access"
    assert entry.metadata["critical"] is True
