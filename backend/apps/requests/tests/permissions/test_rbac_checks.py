import pytest
from typing import Optional
from apps.requests.permissions.constants import Role, Permission
from apps.requests.permissions.matrix import PermissionRegistry
from apps.requests.permissions.checks import RBACChecker, ResourceInterface

class MockResource:
    def __init__(self, customer_id: Optional[int] = None, assigned_technician_id: Optional[int] = None):
        self.customer_id = customer_id
        self.assigned_technician_id = assigned_technician_id

class TestRBACMatrix:

    def test_customer_permissions(self):
        """Verifies strictly allowed and denied actions for Customers."""
        assert PermissionRegistry.role_has_permission(Role.CUSTOMER, Permission.REQUEST_CREATE) is True
        assert PermissionRegistry.role_has_permission(Role.CUSTOMER, Permission.QUOTE_REVISE) is True
        assert PermissionRegistry.role_has_permission(Role.CUSTOMER, Permission.REQUEST_ASSIGN) is False

    def test_technician_permissions(self):
        """Verifies strictly allowed and denied actions for Technicians."""
        assert PermissionRegistry.role_has_permission(Role.TECHNICIAN, Permission.ASSIGNMENT_ACCEPT) is True
        assert PermissionRegistry.role_has_permission(Role.TECHNICIAN, Permission.VERIFICATION_VERIFY) is False
        assert PermissionRegistry.role_has_permission(Role.TECHNICIAN, Permission.QUOTE_REJECT) is False

    def test_staff_permissions(self):
        """Verifies strictly allowed and denied actions for Staff."""
        assert PermissionRegistry.role_has_permission(Role.STAFF, Permission.REQUEST_TRIAGE) is True
        assert PermissionRegistry.role_has_permission(Role.STAFF, Permission.VERIFICATION_VERIFY) is True
        assert PermissionRegistry.role_has_permission(Role.STAFF, Permission.ASSIGNMENT_ACCEPT) is False

class TestRBACScopes:

    def test_customer_owned_scope(self):
        """Verifies Customer can only act on their own requests."""
        resource = MockResource(customer_id=1)
        
        # Owner ID matches User ID
        assert RBACChecker.check_scoped_permission(Role.CUSTOMER, Permission.REQUEST_SUBMIT, user_id=1, resource=resource) is True
        # Owner ID does NOT match
        assert RBACChecker.check_scoped_permission(Role.CUSTOMER, Permission.REQUEST_SUBMIT, user_id=2, resource=resource) is False

    def test_technician_assigned_scope(self):
        """Verifies Technician can only act on assigned requests."""
        resource = MockResource(assigned_technician_id=5)
        
        # Assigned matches
        assert RBACChecker.check_scoped_permission(Role.TECHNICIAN, Permission.REQUEST_UPDATE, user_id=5, resource=resource) is True
        # Unassigned / wrong tech
        assert RBACChecker.check_scoped_permission(Role.TECHNICIAN, Permission.REQUEST_UPDATE, user_id=1, resource=resource) is False

    def test_global_scope_staff(self):
        """Verifies Staff has global scope and does not require explicit resource ownership."""
        resource = MockResource(customer_id=1, assigned_technician_id=5)
        assert RBACChecker.check_scoped_permission(Role.STAFF, Permission.REQUEST_ASSIGN, user_id=99, resource=resource) is True

class TestCancellationPolicy:

    def test_customer_cancellation_bounds(self):
        """Verifies Customer is blocked from cancelling active work."""
        # Pre-assignment (Allowed)
        assert RBACChecker.check_state_aware_cancellation(Role.CUSTOMER, is_active=False, is_owner=True) is True
        # Post-assignment (Denied)
        assert RBACChecker.check_state_aware_cancellation(Role.CUSTOMER, is_active=True, is_owner=True) is False

    def test_staff_cancellation_bounds(self):
        """Verifies Staff requires manager approval for active cancellation."""
        # Pre-assignment (Allowed freely)
        assert RBACChecker.check_state_aware_cancellation(Role.STAFF, is_active=False, is_owner=False) is True
        # Active assignment (Denied without manager)
        assert RBACChecker.check_state_aware_cancellation(Role.STAFF, is_active=True, is_owner=False) is False

    def test_manager_cancellation_bounds(self):
        """Verifies Managers can cancel active requests."""
        assert RBACChecker.check_state_aware_cancellation(Role.MANAGER, is_active=True, is_owner=False) is True
