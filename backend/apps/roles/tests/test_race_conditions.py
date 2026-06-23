import pytest
import threading
from django.contrib.auth import get_user_model
from apps.roles.models import RoleDefinition, UserRole
from apps.roles.services.role_service import RoleService
from core.exceptions import PermissionDeniedError

User = get_user_model()


@pytest.fixture
def manager_role():
    return RoleDefinition.objects.create(name="Manager", slug="manager", hierarchy_level=80)


@pytest.fixture
def staff_role():
    return RoleDefinition.objects.create(name="Staff", slug="staff", hierarchy_level=60)


@pytest.fixture
def superadmin_role():
    return RoleDefinition.objects.create(name="Super Admin", slug="superadmin", hierarchy_level=100)


@pytest.fixture
def manager_user(manager_role):
    u = User.objects.create(email="mgr@example.com", first_name="MGR")
    UserRole.objects.create(user=u, role=manager_role)
    return u


@pytest.fixture
def target_user():
    return User.objects.create(email="target@example.com", first_name="Target")


from django.db import connection

@pytest.mark.django_db(transaction=True)
@pytest.mark.skipif(connection.vendor == 'sqlite', reason="Race condition tests require PostgreSQL concurrent transaction support")
class TestRaceConditions:
    def test_parallel_role_assignment_respects_hierarchy(self, manager_user, target_user, superadmin_role):
        """Test that parallel requests cannot bypass hierarchy checks."""
        results = []
        errors = []
        
        def assign_superadmin():
            try:
                result = RoleService.assign_role(
                    user=target_user,
                    role_slug="superadmin",
                    assigned_by=manager_user
                )
                results.append(result)
            except PermissionDeniedError as e:
                errors.append(str(e))
        
        # Create multiple threads attempting the same forbidden action
        threads = [threading.Thread(target=assign_superadmin) for _ in range(5)]
        
        for t in threads:
            t.start()
        
        for t in threads:
            t.join()
        
        # All attempts should fail
        assert len(results) == 0
        assert len(errors) == 5
        assert all("cannot assign a role higher than or equal" in e for e in errors)
        
        # Target should not have superadmin role
        assert not UserRole.objects.filter(user=target_user, role__slug="superadmin").exists()

    def test_parallel_self_escalation_blocked(self, manager_user, superadmin_role):
        """Test that parallel self-escalation attempts are blocked."""
        errors = []
        
        def self_escalate():
            try:
                RoleService.assign_role(
                    user=manager_user,
                    role_slug="superadmin",
                    assigned_by=manager_user
                )
            except PermissionDeniedError as e:
                errors.append(str(e))
        
        threads = [threading.Thread(target=self_escalate) for _ in range(3)]
        
        for t in threads:
            t.start()
        
        for t in threads:
            t.join()
        
        # All attempts should fail
        assert len(errors) == 3
        assert all("cannot modify their own roles" in e for e in errors)

    def test_parallel_deactivation_respects_last_superadmin(self, superadmin_role):
        """Test that parallel deactivation attempts respect last superadmin protection."""
        sa1 = User.objects.create(email="sa1@example.com")
        sa2 = User.objects.create(email="sa2@example.com")
        
        UserRole.objects.create(user=sa1, role=superadmin_role)
        UserRole.objects.create(user=sa2, role=superadmin_role)
        
        errors = []
        
        def deactivate_sa1():
            try:
                RoleService.deactivate_role(
                    user=sa1,
                    role_slug="superadmin",
                    deactivated_by=sa2
                )
            except PermissionDeniedError as e:
                errors.append(str(e))
        
        def deactivate_sa2():
            try:
                RoleService.deactivate_role(
                    user=sa2,
                    role_slug="superadmin",
                    deactivated_by=sa1
                )
            except PermissionDeniedError as e:
                errors.append(str(e))
        
        t1 = threading.Thread(target=deactivate_sa1)
        t2 = threading.Thread(target=deactivate_sa2)
        
        t1.start()
        t2.start()
        
        t1.join()
        t2.join()
        
        # Both should fail due to equal-rank restriction
        assert len(errors) == 2
        assert all("cannot modify a user with a higher or equal hierarchy" in e for e in errors)
        
        # Both superadmins should remain active
        assert UserRole.objects.filter(role=superadmin_role, is_active=True).count() == 2
