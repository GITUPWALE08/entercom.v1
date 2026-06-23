import pytest
from django.contrib.auth import get_user_model
from apps.roles.models import RoleDefinition, UserRole, RoleChangeRequest, ApprovalRequestStatus
from apps.roles.services.role_service import RoleService
from core.exceptions import PermissionDeniedError

User = get_user_model()

@pytest.fixture
def superadmin_role():
    return RoleDefinition.objects.create(name="Super Admin", slug="superadmin", hierarchy_level=100)

@pytest.fixture
def manager_role():
    return RoleDefinition.objects.create(name="Manager", slug="manager", hierarchy_level=80)

@pytest.fixture
def staff_role():
    return RoleDefinition.objects.create(name="Staff", slug="staff", hierarchy_level=60)

@pytest.fixture
def superadmin_user(superadmin_role):
    u = User.objects.create(email="sa@example.com", first_name="SA")
    UserRole.objects.create(user=u, role=superadmin_role)
    return u

@pytest.fixture
def manager_user(manager_role):
    u = User.objects.create(email="mgr@example.com", first_name="MGR")
    UserRole.objects.create(user=u, role=manager_role)
    return u

@pytest.fixture
def target_user():
    return User.objects.create(email="target@example.com", first_name="Target")

@pytest.fixture
def staff_user(staff_role):
    u = User.objects.create(email="staff@example.com", first_name="Staff")
    UserRole.objects.create(user=u, role=staff_role)
    return u

@pytest.mark.django_db
class TestRoleServiceHardening:
    def test_manager_cannot_assign_superadmin(self, manager_user, target_user, superadmin_role):
        with pytest.raises(PermissionDeniedError, match="cannot assign a role higher than or equal to their own"):
            RoleService.assign_role(
                user=target_user,
                role_slug="superadmin",
                assigned_by=manager_user
            )

    def test_manager_cannot_assign_manager(self, manager_user, target_user, manager_role):
        with pytest.raises(PermissionDeniedError, match="cannot assign a role higher than or equal to their own"):
            RoleService.assign_role(
                user=target_user,
                role_slug="manager",
                assigned_by=manager_user
            )

    def test_staff_cannot_modify_manager(self, staff_user, manager_user, staff_role):
        with pytest.raises(PermissionDeniedError):
            RoleService.assign_role(
                user=manager_user,
                role_slug="staff",
                assigned_by=staff_user
            )

    def test_staff_cannot_escalate_to_manager(self, staff_user, target_user, manager_role):
        with pytest.raises(PermissionDeniedError, match="cannot assign a role higher than or equal"):
            RoleService.assign_role(
                user=target_user,
                role_slug="manager",
                assigned_by=staff_user,
            )

    def test_manager_cannot_modify_manager(self, manager_user, manager_role, staff_role):
        other = User.objects.create(email="mgr2@example.com")
        UserRole.objects.create(user=other, role=manager_role)
        with pytest.raises(PermissionDeniedError, match="cannot modify a user with a higher or equal hierarchy"):
            RoleService.assign_role(
                user=other,
                role_slug="staff",
                assigned_by=manager_user,
            )

    def test_self_escalation_blocked(self, manager_user, superadmin_role):
        with pytest.raises(PermissionDeniedError, match="cannot modify their own roles"):
            RoleService.assign_role(
                user=manager_user,
                role_slug="superadmin",
                assigned_by=manager_user
            )

    def test_deactivate_role_hierarchy(self, manager_user, superadmin_user):
        with pytest.raises(PermissionDeniedError):
            RoleService.deactivate_role(
                user=superadmin_user,
                role_slug="superadmin",
                deactivated_by=manager_user
            )

    def test_deactivate_last_superadmin_blocked(self, superadmin_user, superadmin_role):
        with pytest.raises(PermissionDeniedError, match="cannot deactivate their own roles"):
            RoleService.deactivate_role(
                user=superadmin_user,
                role_slug="superadmin",
                deactivated_by=superadmin_user,
            )

        with pytest.raises(PermissionDeniedError, match="Cannot deactivate the last remaining Super Admin"):
            RoleService.deactivate_role(
                user=superadmin_user,
                role_slug="superadmin",
                deactivated_by=None,
            )

        sa2 = User.objects.create(email="sa2@example.com")
        UserRole.objects.create(user=sa2, role=superadmin_role, is_active=True)

        # Equal rank deactivation is now ALLOWED for Super Admins
        RoleService.deactivate_role(
            user=superadmin_user,
            role_slug="superadmin",
            deactivated_by=sa2,
        )
        assert UserRole.objects.filter(user=superadmin_user, role=superadmin_role, is_active=False).exists()
        assert UserRole.objects.filter(role=superadmin_role, is_active=True).count() == 1

    def test_dual_control_for_staff_assignment_by_manager(self, manager_user, target_user, staff_role):
        # Manager assigning Staff should trigger a RoleChangeRequest, not direct assignment
        # if the policy says Staff+ requires dual control.
        # Spec §7.1: "Role assignments (particularly Staff, Manager, and Super Admin) require strict dual-control."
        
        result = RoleService.assign_role(
            user=target_user,
            role_slug="staff",
            assigned_by=manager_user
        )
        
        if isinstance(result, RoleChangeRequest):
            assert result.status == ApprovalRequestStatus.PENDING
            assert result.requested_role == staff_role
            assert not UserRole.objects.filter(user=target_user, role=staff_role).exists()
        else:
            pytest.fail("Should have created a RoleChangeRequest for Staff role")
