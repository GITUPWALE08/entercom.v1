import pytest
import logging
from django.contrib.auth import get_user_model
from django.test import TransactionTestCase
from core.exceptions import PermissionDeniedError
from apps.audit_logs.models import AuditLogEntry
from apps.roles.models import RoleDefinition, UserRole, RoleChangeRequest
from apps.roles.services.role_service import RoleService
from unittest.mock import patch

User = get_user_model()

@pytest.mark.django_db(transaction=True)
class TestRoleElevationSecurity(TransactionTestCase):
    """
    Ensures that users cannot elevate permissions beyond their own hierarchy level.
    Validates forensic log survival during transaction rollbacks.
    """

    def test_manager_cannot_assign_superadmin_to_others(self):
        # STRATEGY: Instead of fighting caplog/pytest-django integration in TransactionTestCase,
        # we mock the security_logger and verify it was called with the correct data.
        # This proves the OOB emission happened before the rollback.
        
        manager_role = RoleDefinition.objects.get_or_create(slug="manager", defaults={"name": "Manager", "hierarchy_level": 80})[0]
        superadmin_role = RoleDefinition.objects.get_or_create(slug="superadmin", defaults={"name": "Super Admin", "hierarchy_level": 100})[0]
        
        manager_user = User.objects.create_user(email="manager_attack@example.com", password="password", first_name="Manager", last_name="Attacker")
        UserRole.objects.create(user=manager_user, role=manager_role)
        
        target_user = User.objects.create_user(email="target_elevation@example.com", password="password", first_name="Target", last_name="User")

        with patch("apps.audit_logs.services.audit_service.security_logger") as mock_security_logger:
            # 1. Attempt to elevate target user to superadmin
            with pytest.raises(PermissionDeniedError):
                RoleService.assign_role(
                    user=target_user,
                    role_slug="superadmin",
                    assigned_by=manager_user,
                    reason="Malicious elevation"
                )

            # 2. Verify no role or request was assigned (Database side)
            assert not UserRole.objects.filter(user=target_user, role=superadmin_role).exists()

            # 3. Verify forensic log emission was ATTEMPTED before rollback
            # Since the mock is outside the transaction or independent of it, we check calls.
            assert mock_security_logger.info.called
            args, kwargs = mock_security_logger.info.call_args
            assert "security.role_escalation_denied" in args[0]
            assert kwargs["extra"]["audit_data"]["actor_id"] == str(manager_user.id)
            assert kwargs["extra"]["forensic"] is True

    def test_manager_cannot_elevate_self(self):
        RoleDefinition.objects.get_or_create(slug="superadmin", defaults={"name": "Super Admin", "hierarchy_level": 100})
        manager_role = RoleDefinition.objects.get_or_create(slug="manager", defaults={"name": "Manager", "hierarchy_level": 80})[0]
        manager_user = User.objects.create_user(email="manager_self@example.com", password="password", first_name="Manager", last_name="Self")
        UserRole.objects.create(user=manager_user, role=manager_role)

        # 1. Manager attempts to give themselves superadmin
        with pytest.raises(PermissionDeniedError) as exc:
            RoleService.assign_role(
                user=manager_user,
                role_slug="superadmin",
                assigned_by=manager_user,
                reason="Self elevation"
            )
            
        assert "own roles" in str(exc.value).lower()

    def test_manager_assignment_logic_valid_path(self):
        manager_role = RoleDefinition.objects.get_or_create(slug="manager", defaults={"name": "Manager", "hierarchy_level": 80})[0]
        staff_role = RoleDefinition.objects.get_or_create(slug="staff", defaults={"name": "Staff", "hierarchy_level": 50})[0]
        
        manager_user = User.objects.create_user(email="manager_valid@example.com", password="password", first_name="Manager", last_name="Valid")
        UserRole.objects.create(user=manager_user, role=manager_role)
        
        target_user = User.objects.create_user(email="target_valid@example.com", password="password", first_name="Target", last_name="User")
        
        # 1. Manager assigning staff (80 > 50) 
        result = RoleService.assign_role(
            user=target_user,
            role_slug="staff",
            assigned_by=manager_user,
            reason="New hire"
        )
        
        assert isinstance(result, RoleChangeRequest)
        assert result.requested_role == staff_role
