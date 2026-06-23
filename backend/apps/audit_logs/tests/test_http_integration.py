"""Full HTTP stack audit integration tests."""

from __future__ import annotations

import pytest
from unittest.mock import patch
from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient

from apps.audit_logs.models import AuditLogEntry
from apps.roles.models import PermissionDefinition, RoleDefinition, RolePermission, UserRole
from apps.roles.services.role_service import RoleService

User = get_user_model()


@pytest.mark.django_db
class TestHttpAuditIntegration:
    @pytest.fixture
    def api_client(self):
        return APIClient()

    @pytest.fixture
    def user(self):
        u = User.objects.create_user(
            email="http-audit@example.com",
            password="testpassword123",
            first_name="Http",
            last_name="Audit",
        )
        return u

    def test_login_success_creates_audit_with_request_id(self, api_client, user):
        response = api_client.post(
            reverse("authentication:login"),
            {"email": user.email, "password": "testpassword123"},
            format="json",
            HTTP_X_REQUEST_ID="integration-req-1",
            HTTP_X_CORRELATION_ID="integration-corr-1",
        )
        assert response.status_code == status.HTTP_200_OK
        entry = AuditLogEntry.objects.filter(action="auth.login_success").latest("created_at")
        assert entry.request_id == "integration-req-1"
        assert entry.correlation_id == "integration-corr-1"
        assert entry.actor_email_snapshot == user.email

    def test_login_failure_creates_audit(self, api_client, user):
        response = api_client.post(
            reverse("authentication:login"),
            {"email": user.email, "password": "wrong"},
            format="json",
        )
        assert response.status_code == status.HTTP_401_UNAUTHORIZED
        assert AuditLogEntry.objects.filter(action="auth.login_failed").exists()

    def test_refresh_failure_creates_audit(self, api_client):
        response = api_client.post(
            reverse("authentication:token_refresh"),
            {"refresh": "invalid-token-value"},
            format="json",
        )
        assert response.status_code == status.HTTP_401_UNAUTHORIZED
        assert AuditLogEntry.objects.filter(action="auth.token_refresh_failed").exists()

    def test_role_escalation_denial_creates_audit(self, user):
        staff_role = RoleDefinition.objects.create(name="Staff", slug="staff", hierarchy_level=60)
        manager_role = RoleDefinition.objects.create(name="Manager", slug="manager", hierarchy_level=80)
        staff = User.objects.create(email="staff-esc@example.com")
        UserRole.objects.create(user=staff, role=staff_role)
        target = User.objects.create(email="target-esc@example.com")

        with patch("apps.audit_logs.services.audit_service.security_logger") as mock_security_logger:
            with pytest.raises(Exception):
                RoleService.assign_role(
                    user=target,
                    role_slug="manager",
                    assigned_by=staff,
                )

            # 1. Verify forensic stream emission (survives rollback)
            assert mock_security_logger.info.called
            found_forensic = any(
                "security.role_escalation_denied" in call.args[0] 
                for call in mock_security_logger.info.call_args_list
            )
            assert found_forensic, "Forensic audit log missing from stream after rollback"

            # 2. Verify database state (rolled back)
            assert not AuditLogEntry.objects.filter(
                action="security.role_escalation_denied"
            ).exists()

    def test_fail_closed_route_returns_403_and_audits(self, api_client, user):
        api_client.force_authenticate(user=user)
        response = api_client.get("/api/v1/audit-logs/")
        assert response.status_code == status.HTTP_403_FORBIDDEN
        assert AuditLogEntry.objects.filter(action="security.rbac_denied").exists()

    def test_audit_view_access_with_permission(self, api_client, user, audit_view_permission):
        role = RoleDefinition.objects.create(name="Auditor", slug="auditor", hierarchy_level=70)
        RolePermission.objects.create(role=role, permission=audit_view_permission)
        UserRole.objects.create(user=user, role=role)
        api_client.force_authenticate(user=user)
        response = api_client.get("/api/v1/audit-logs/")
        assert response.status_code == status.HTTP_200_OK
