import pytest
from django.db import IntegrityError
from django.utils import timezone
from datetime import timedelta

from apps.roles.models import (
    PermissionDefinition,
    RoleDefinition,
    RolePermission,
    UserRole,
    ApprovalRequest,
    ApprovalRequestStatus,
    PermissionCacheVersion,
)
from apps.users.models import User


@pytest.fixture
def user():
    return User.objects.create(email="test@example.com", first_name="Test", last_name="User")


@pytest.mark.django_db
class TestPermissionDefinition:
    def test_model_creation_and_str(self):
        perm = PermissionDefinition.objects.create(
            codename="request.view",
            name="View Request",
            resource="request",
            action="view",
        )
        assert str(perm) == "request.view"
        assert perm.is_active is True

    def test_codename_uniqueness(self):
        PermissionDefinition.objects.create(codename="test.unique", name="Test 1")
        with pytest.raises(IntegrityError):
            PermissionDefinition.objects.create(codename="test.unique", name="Test 2")


@pytest.mark.django_db
class TestRoleDefinition:
    def test_hierarchy_values(self):
        super_admin = RoleDefinition.objects.create(name="Super Admin", slug="superadmin", hierarchy_level=100)
        manager = RoleDefinition.objects.create(name="Manager", slug="manager", hierarchy_level=80)
        staff = RoleDefinition.objects.create(name="Staff", slug="staff", hierarchy_level=60)
        
        assert super_admin.hierarchy_level > manager.hierarchy_level
        assert manager.hierarchy_level > staff.hierarchy_level
        assert str(super_admin) == "Super Admin"

    def test_soft_deactivation(self):
        role = RoleDefinition.objects.create(name="Temp", slug="temp", is_active=True)
        role.is_active = False
        role.save()
        
        # It's soft deactivated, still exists in DB
        assert RoleDefinition.objects.filter(slug="temp").exists()
        assert RoleDefinition.objects.get(slug="temp").is_active is False


@pytest.mark.django_db
class TestRolePermission:
    def test_unique_together(self, user):
        role = RoleDefinition.objects.create(name="Staff", slug="staff")
        perm = PermissionDefinition.objects.create(codename="request.view", name="View")
        
        rp1 = RolePermission.objects.create(role=role, permission=perm, created_by=user)
        assert str(rp1) == "staff -> request.view"
        
        with pytest.raises(IntegrityError):
            RolePermission.objects.create(role=role, permission=perm, created_by=user)


@pytest.mark.django_db
class TestUserRole:
    def test_expiry_support(self, user):
        role = RoleDefinition.objects.create(name="Staff", slug="staff")
        future_date = timezone.now() + timedelta(days=1)
        
        ur = UserRole.objects.create(
            user=user,
            role=role,
            assigned_by=user,
            expires_at=future_date,
        )
        assert str(ur) == f"{user.email} - staff"
        assert ur.expires_at == future_date
        assert ur.is_active is True


@pytest.mark.django_db
class TestApprovalRequest:
    def test_enum_integrity_and_creation(self, user):
        target = User.objects.create(email="target@example.com", first_name="Target", last_name="User")
        
        req = ApprovalRequest.objects.create(
            request_type="role_assignment",
            initiator=user,
            target_user=target,
            status=ApprovalRequestStatus.PENDING,
            metadata={"role": "manager"}
        )
        assert req.status == "PENDING"
        assert str(req) == f"role_assignment - PENDING by {user.email}"
        
        # Test updating enum
        req.status = ApprovalRequestStatus.APPROVED
        req.save()
        assert req.status == "APPROVED"


@pytest.mark.django_db
class TestPermissionCacheVersion:
    def test_creation(self, user):
        cache = PermissionCacheVersion.objects.create(user=user, version=2)
        assert str(cache) == f"{user.email} - v2"
