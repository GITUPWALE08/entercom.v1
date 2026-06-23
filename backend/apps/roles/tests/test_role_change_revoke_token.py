import uuid
import pytest
from django.contrib.auth import get_user_model
from rest_framework_simplejwt.token_blacklist.models import OutstandingToken
from rest_framework_simplejwt.tokens import RefreshToken

from apps.roles.models import RoleDefinition, UserRole
from apps.roles.services.role_service import RoleService
from apps.authentication.models import UserSession
from apps.authentication.services.auth_service import AuthService

User = get_user_model()

@pytest.fixture
def superadmin_role():
    return RoleDefinition.objects.get_or_create(
        slug="superadmin", 
        defaults={"name": "Super Admin", "hierarchy_level": 100}
    )[0]

@pytest.fixture
def staff_role():
    return RoleDefinition.objects.get_or_create(
        slug="staff", 
        defaults={"name": "Staff", "hierarchy_level": 50}
    )[0]

@pytest.fixture
def target_user():
    return User.objects.create_user(
        email="target@example.com", 
        password="password123",
        first_name="Target", 
        last_name="User"
    )

@pytest.fixture
def admin_user(superadmin_role):
    u = User.objects.create_user(
        email="admin@example.com", 
        password="password123",
        first_name="Admin", 
        last_name="User"
    )
    UserRole.objects.create(user=u, role=superadmin_role)
    return u

@pytest.mark.django_db
class TestRoleChangeRevocation:
    """
    Ensures that changing a user's role revokes all active sessions and tokens.
    """

    def test_assign_role_revokes_sessions(self, target_user, admin_user, staff_role):
        # 1. Create a session for the target user
        refresh = RefreshToken.for_user(target_user)
        AuthService.track_session(target_user, refresh, {"ip_address": "127.0.0.1", "user_agent": "Test"})
        
        # Verify session is active
        session = UserSession.objects.get(user=target_user, refresh_jti=refresh["jti"])
        assert session.is_active is True
        assert OutstandingToken.objects.filter(user=target_user).exists()

        # 2. Assign a role
        RoleService.assign_role(
            user=target_user,
            role_slug="staff",
            assigned_by=admin_user,
            reason="Promotion"
        )

        # 3. Verify session is revoked
        session.refresh_from_db()
        assert session.is_active is False
        assert not OutstandingToken.objects.filter(user=target_user).exists()

    def test_deactivate_role_revokes_sessions(self, target_user, admin_user, staff_role):
        # 1. Assign role and create session
        RoleService.assign_role(user=target_user, role_slug="staff", assigned_by=admin_user)
        refresh = RefreshToken.for_user(target_user)
        AuthService.track_session(target_user, refresh, {"ip_address": "127.0.0.1", "user_agent": "Test"})
        
        # 2. Deactivate role
        RoleService.deactivate_role(user=target_user, role_slug="staff", deactivated_by=admin_user)

        # 3. Verify session is revoked
        session = UserSession.objects.get(user=target_user, refresh_jti=refresh["jti"])
        assert session.is_active is False
        assert not OutstandingToken.objects.filter(user=target_user).exists()

    def test_role_version_incremented(self, target_user, admin_user, staff_role):
        initial_version = target_user.role_version
        
        # Assign role
        RoleService.assign_role(user=target_user, role_slug="staff", assigned_by=admin_user)
        
        target_user.refresh_from_db()
        assert target_user.role_version == initial_version + 1

        # Deactivate role
        RoleService.deactivate_role(user=target_user, role_slug="staff", deactivated_by=admin_user)
        
        target_user.refresh_from_db()
        assert target_user.role_version == initial_version + 2
