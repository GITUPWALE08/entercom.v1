import pytest
from django.core.management import call_command
from django.utils import timezone
from datetime import timedelta
from apps.roles.models import RoleDefinition, UserRole
from apps.users.models import User
from apps.audit_logs.models import AuditLogEntry

@pytest.mark.django_db
def test_cleanup_expired_roles_command():
    user = User.objects.create(email="temp@example.com")
    role = RoleDefinition.objects.create(name="Staff", slug="staff")
    
    # Create an expired role
    expired_at = timezone.now() - timedelta(hours=1)
    UserRole.objects.create(user=user, role=role, expires_at=expired_at, is_active=True)
    
    # Create a non-expired role
    user2 = User.objects.create(email="active@example.com")
    future_at = timezone.now() + timedelta(hours=1)
    UserRole.objects.create(user=user2, role=role, expires_at=future_at, is_active=True)
    
    # Run command
    call_command("cleanup_expired_roles")
    
    # Verify
    assert UserRole.objects.get(user=user).is_active is False
    assert UserRole.objects.get(user=user2).is_active is True
    
    # Verify Audit Log
    assert AuditLogEntry.objects.filter(action="roles.assignment_expired").exists()
