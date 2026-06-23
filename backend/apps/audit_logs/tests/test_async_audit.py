import pytest
from unittest.mock import patch
from django.conf import settings
from django.contrib.auth import get_user_model
from apps.audit_logs.services.audit_service import log_action
from apps.audit_logs.models import AuditLogEntry

User = get_user_model()

@pytest.fixture
def user():
    return User.objects.create(email="user3@example.com")

@pytest.mark.django_db
@patch('apps.audit_logs.tasks.process_async_audit_log.delay')
def test_async_audit_logging_noncritical(mock_delay, user, settings):
    settings.AUDIT_ASYNC_ENABLED = True
    result = log_action(
        action="websocket.disconnect",
        actor=user,
        reason="Test disconnect"
    )
    
    assert result is None  # Async returns None
    assert mock_delay.called
    args = mock_delay.call_args[0][0]
    assert args["action"] == "websocket.disconnect"

@pytest.mark.django_db
@patch('apps.audit_logs.tasks.process_async_audit_log.delay')
def test_async_audit_bypassed_for_critical(mock_delay, user, settings):
    settings.AUDIT_ASYNC_ENABLED = True
    result = log_action(
        action="security.override_used",
        actor=user,
        reason="Test override"
    )
    
    # Critical action should bypass async and write synchronously
    assert result is not None
    assert not mock_delay.called
    assert result.action == "security.override_used"
