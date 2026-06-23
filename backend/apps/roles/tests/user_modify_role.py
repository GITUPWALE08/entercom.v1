import pytest
import logging
from django.contrib.auth import get_user_model
from django.test import TransactionTestCase
from unittest.mock import patch
from core.exceptions import PermissionDeniedError
from apps.roles.models import RoleDefinition, UserRole
from apps.roles.services.role_service import RoleService

User = get_user_model()

@pytest.mark.django_db(transaction=True)
class TestSelfRoleModification(TransactionTestCase):
    """
    Security verification: Users must never be able to modify their own roles.
    This prevents self-elevation attacks and accidental self-lockout.
    """

    def setUp(self):
        self.staff_role = RoleDefinition.objects.get_or_create(
            slug="staff", 
            defaults={"name": "Staff", "hierarchy_level": 50}
        )[0]
        self.manager_role = RoleDefinition.objects.get_or_create(
            slug="manager", 
            defaults={"name": "Manager", "hierarchy_level": 80}
        )[0]
        
        self.user = User.objects.create_user(
            email="self_attacker@example.com", 
            password="password",
            first_name="Self",
            last_name="Attacker"
        )
        # Give them staff role initially
        UserRole.objects.create(user=self.user, role=self.staff_role)

    def test_user_cannot_assign_self_new_role(self):
        """
        Confirms a user cannot use RoleService to assign themselves a different role.
        """
        with patch("apps.audit_logs.services.audit_service.security_logger") as mock_security_logger:
            with pytest.raises(PermissionDeniedError) as exc:
                RoleService.assign_role(
                    user=self.user,
                    role_slug="manager",
                    assigned_by=self.user,
                    reason="I want more power"
                )
            
            assert "cannot modify their own roles" in str(exc.value).lower()
            
            # Verify database state remained unchanged
            assert not UserRole.objects.filter(user=self.user, role=self.manager_role).exists()
            
            # Verify forensic audit survived rollback
            assert mock_security_logger.info.called
            args, kwargs = mock_security_logger.info.call_args
            assert "security.role_escalation_denied" in args[0]
            assert kwargs["extra"]["audit_data"]["actor_id"] == str(self.user.id)
            assert "own roles" in kwargs["extra"]["audit_data"]["reason"]

    def test_user_cannot_deactivate_own_role(self):
        """
        Confirms a user cannot use RoleService to deactivate their own existing role.
        """
        with patch("apps.audit_logs.services.audit_service.security_logger") as mock_security_logger:
            with pytest.raises(PermissionDeniedError) as exc:
                RoleService.deactivate_role(
                    user=self.user,
                    role_slug="staff",
                    deactivated_by=self.user
                )
            
            assert "cannot deactivate their own roles" in str(exc.value).lower()
            
            # Verify role is still active
            assert UserRole.objects.filter(user=self.user, role=self.staff_role, is_active=True).exists()
            
            # Verify forensic audit survived rollback
            assert mock_security_logger.info.called
            args, kwargs = mock_security_logger.info.call_args
            assert "security.role_escalation_denied" in args[0]
            assert "deactivate their own roles" in kwargs["extra"]["audit_data"]["reason"]
