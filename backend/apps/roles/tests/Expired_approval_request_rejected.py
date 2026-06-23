import pytest
import logging
from django.contrib.auth import get_user_model
from django.test import TransactionTestCase
from django.utils import timezone
from datetime import timedelta
from unittest.mock import patch
from core.exceptions import PermissionDeniedError
from apps.roles.models import RoleDefinition, UserRole, RoleChangeRequest, ApprovalRequestStatus
from apps.roles.services.role_service import RoleService

User = get_user_model()

@pytest.mark.django_db(transaction=True)
class TestExpiredApprovalSecurity(TransactionTestCase):
    """
    Security verification: Expired role change requests must never be approvable.
    This prevents stale permission grants.
    """

    def setUp(self):
        self.superadmin_role = RoleDefinition.objects.get_or_create(
            slug="superadmin", 
            defaults={"name": "Super Admin", "hierarchy_level": 100}
        )[0]
        self.staff_role = RoleDefinition.objects.get_or_create(
            slug="staff", 
            defaults={"name": "Staff", "hierarchy_level": 50}
        )[0]
        
        # Initiator admin
        self.admin_initiator = User.objects.create_user(
            email="initiator@example.com", 
            password="password",
            first_name="Admin",
            last_name="One"
        )
        UserRole.objects.create(user=self.admin_initiator, role=self.superadmin_role, is_active=True)

        # Approver admin
        self.admin_approver = User.objects.create_user(
            email="approver@example.com", 
            password="password",
            first_name="Admin",
            last_name="Two"
        )
        UserRole.objects.create(user=self.admin_approver, role=self.superadmin_role, is_active=True)

        self.target = User.objects.create_user(
            email="target@example.com", 
            password="password",
            first_name="Target",
            last_name="User"
        )

    def test_cannot_approve_expired_request(self):
        """
        Confirms that a request with expires_at in the past is rejected.
        """
        # 1. Create a request that expired 1 hour ago
        expired_at = timezone.now() - timedelta(hours=1)
        request = RoleChangeRequest.objects.create(
            initiator=self.admin_initiator,
            target_user=self.target,
            requested_role=self.staff_role,
            status=ApprovalRequestStatus.PENDING,
            expires_at=expired_at,
            reason="Expired test"
        )

        with patch("apps.audit_logs.services.audit_service.security_logger") as mock_security_logger:
            # 2. Attempt to approve
            with pytest.raises(PermissionDeniedError) as exc:
                RoleService.approve_role_change(request, self.admin_approver)
            
            assert "expired" in str(exc.value).lower()
            
            # 3. Verify database side: Status must still be PENDING (due to rollback)
            request.refresh_from_db()
            assert request.status == ApprovalRequestStatus.PENDING
            assert not UserRole.objects.filter(user=self.target, role=self.staff_role).exists()

            # 4. Verify forensic audit survived rollback
            assert mock_security_logger.info.called
            
            timeout_logged = any(
                "roles.approval_timeout" in str(call.args[0]) for call in mock_security_logger.info.call_args_list
            )
            denial_logged = any(
                "security.approval_denied" in str(call.args[0]) for call in mock_security_logger.info.call_args_list
            )
            
            assert timeout_logged, "roles.approval_timeout missing from forensic stream"
            assert denial_logged, "security.approval_denied missing from forensic stream"
