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
class TestLastSuperAdminProtection(TransactionTestCase):
    """
    Security verification: The system must never allow deactivating the last Super Admin.
    This prevents permanent administrative lockout.
    """

    def setUp(self):
        self.superadmin_role = RoleDefinition.objects.get_or_create(
            slug="superadmin", 
            defaults={"name": "Super Admin", "hierarchy_level": 100}
        )[0]
        
        # Create our first Super Admin
        self.admin1 = User.objects.create_user(
            email="admin1@example.com", 
            password="password",
            first_name="Admin",
            last_name="One"
        )
        UserRole.objects.create(user=self.admin1, role=self.superadmin_role, is_active=True)

    def test_cannot_deactivate_the_only_superadmin_system_actor(self):
        """
        Confirms deactivation is blocked when only one Super Admin exists,
        even when performed by the system (deactivated_by=None).
        """
        with patch("apps.audit_logs.services.audit_service.security_logger") as mock_security_logger:
            # System attempts to deactivate the only admin
            with pytest.raises(PermissionDeniedError) as exc:
                RoleService.deactivate_role(
                    user=self.admin1,
                    role_slug="superadmin",
                    deactivated_by=None
                )
            
            assert "last remaining super admin" in str(exc.value).lower()
            
            # Verify database state: Role MUST still be active
            assert UserRole.objects.filter(user=self.admin1, role=self.superadmin_role, is_active=True).exists()
            
            # Verify forensic audit survived rollback
            assert mock_security_logger.info.called
            args, kwargs = mock_security_logger.info.call_args
            assert "security.role_escalation_denied" in args[0]
            assert "last remaining Super Admin" in kwargs["extra"]["audit_data"]["reason"]

    def test_can_deactivate_one_if_another_exists(self):
        """
        Confirms deactivation is allowed if at least one other Super Admin remains.
        """
        # Create a second Super Admin
        admin2 = User.objects.create_user(
            email="admin2@example.com", 
            password="password",
            first_name="Admin",
            last_name="Two"
        )
        UserRole.objects.create(user=admin2, role=self.superadmin_role, is_active=True)

        # Deactivate Admin1 (by Admin2)
        # Admin2 is active, so they pass hierarchy check.
        RoleService.deactivate_role(
            user=self.admin1,
            role_slug="superadmin",
            deactivated_by=admin2
        )

        # Verify Admin1 is deactivated
        assert not UserRole.objects.filter(user=self.admin1, role=self.superadmin_role, is_active=True).exists()
        # Verify Admin2 is still active
        assert UserRole.objects.filter(user=admin2, role=self.superadmin_role, is_active=True).exists()

    def test_cannot_deactivate_last_even_by_another_active_admin(self):
        """
        Confirms an active admin cannot deactivate the ONLY OTHER active admin, 
        even if they themselves are staying active.
        Wait, if Admin2 deactivates Admin1, and Admin2 is active, that's ALLOWED.
        The block is when deactivating the user would leave ZERO admins.
        """
        admin2 = User.objects.create_user(
            email="admin2_protect@example.com", 
            password="password",
            first_name="Admin",
            last_name="Two"
        )
        UserRole.objects.create(user=admin2, role=self.superadmin_role, is_active=True)
        
        # Now we have Admin1 and Admin2 (Both Active).
        # Admin2 deactivates Admin1. 
        # This is allowed because Admin2 remains active.
        RoleService.deactivate_role(user=self.admin1, role_slug="superadmin", deactivated_by=admin2)
        
        # Verify Admin1 is gone
        assert not UserRole.objects.filter(user=self.admin1, role=self.superadmin_role, is_active=True).exists()
        
        # Now Admin2 is the LAST ONE.
        # System (or Admin2 if we bypass self-mod) attempts to deactivate Admin2.
        with pytest.raises(PermissionDeniedError) as exc:
            RoleService.deactivate_role(
                user=admin2,
                role_slug="superadmin",
                deactivated_by=None # Bypass self-mod check to hit the 'last admin' check
            )
            
        assert "last remaining" in str(exc.value).lower()
        assert UserRole.objects.filter(user=admin2, role=self.superadmin_role, is_active=True).exists()
