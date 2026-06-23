import pytest
from django.contrib.auth import get_user_model

from apps.audit_logs.models import AuditLogEntry
from apps.audit_logs.services.audit_service import log_action
from apps.roles.models import RoleDefinition, UserRole

User = get_user_model()


@pytest.mark.django_db
class TestActorSnapshot:
    def test_actor_snapshot_persists_after_user_reference_cleared(self):
        user = User.objects.create(email="snap@example.com")
        role = RoleDefinition.objects.create(name="Staff", slug="staff", hierarchy_level=60)
        UserRole.objects.create(user=user, role=role)
        entry = log_action(action="roles.test", actor=user)
        assert entry.actor_email_snapshot == "snap@example.com"
        assert "staff" in entry.actor_role_snapshot
        user.email = "changed@example.com"
        user.save()
        entry.refresh_from_db()
        assert entry.actor_email_snapshot == "snap@example.com"
