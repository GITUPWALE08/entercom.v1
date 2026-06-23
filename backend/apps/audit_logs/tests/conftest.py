import pytest
from django.contrib.auth import get_user_model

from apps.roles.models import PermissionDefinition, RoleDefinition, RolePermission, UserRole

User = get_user_model()


@pytest.fixture
def websocket_connect_permission(db):
    return PermissionDefinition.objects.get_or_create(
        codename="websocket.connect",
        defaults={
            "name": "WebSocket Connect",
            "resource": "websocket",
            "action": "connect",
            "is_active": True,
        },
    )[0]


@pytest.fixture
def audit_view_permission(db):
    return PermissionDefinition.objects.get_or_create(
        codename="audit.view",
        defaults={
            "name": "View Audit Logs",
            "resource": "audit",
            "action": "view",
            "is_active": True,
        },
    )[0]


@pytest.fixture
def grant_websocket_connect(websocket_connect_permission):
    def _grant(user, role):
        RolePermission.objects.get_or_create(role=role, permission=websocket_connect_permission)
        UserRole.objects.get_or_create(user=user, role=role, defaults={"is_active": True})

    return _grant
