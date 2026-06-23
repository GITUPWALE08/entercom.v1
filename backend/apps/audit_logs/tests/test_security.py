"""Security-focused audit logging tests (Stage 4)."""

from __future__ import annotations

from datetime import timedelta
from unittest.mock import patch

import pytest
from channels.testing import WebsocketCommunicator
from django.contrib.auth import get_user_model
from django.core.exceptions import PermissionDenied
from django.core.management import call_command
from apps.audit_logs.models import AuditLogEntry
from apps.audit_logs.services.audit_service import log_action, log_permission_denial
from apps.audit_logs.tasks import trace_probe
from apps.authentication.services.auth_service import AuthService
from apps.audit_logs.exceptions import AuditFailureError
from apps.roles.models import (
    ApprovalRequestStatus,
    RoleChangeRequest,
    RoleDefinition,
    RolePermission,
    UserRole,
)
from apps.roles.services.role_service import RoleService
from apps.websocket.consumers import SystemConsumer
from config.asgi import application
from config.celery import app
from core.middleware.request_id import correlation_id_ctx, request_id_ctx
from core.trace_context import bind_standalone_trace, clear_trace_context

User = get_user_model()


@pytest.fixture
def user():
    return User.objects.create(email="sec@example.com", password="x")


@pytest.mark.django_db
class TestAuditImmutability:
    def test_existing_log_save_raises(self, user):
        entry = log_action(action="test.immutable", actor=user)
        entry.reason = "tamper"
        with pytest.raises(PermissionDenied, match="immutable"):
            entry.save()

    def test_existing_log_delete_raises(self, user):
        entry = log_action(action="test.immutable", actor=user)
        with pytest.raises(PermissionDenied, match="immutable"):
            entry.delete()

    def test_bulk_delete_raises(self, user):
        log_action(action="test.bulk", actor=user)
        with pytest.raises(PermissionDenied, match="cannot be deleted"):
            AuditLogEntry.objects.all().delete()

    def test_queryset_update_raises(self, user):
        log_action(action="test.bulk", actor=user)
        with pytest.raises(PermissionDenied, match="cannot be modified"):
            AuditLogEntry.objects.all().update(reason="tamper")

    def test_bulk_update_raises(self, user):
        entry = log_action(action="test.bulk", actor=user)
        with pytest.raises(PermissionDenied, match="cannot be modified"):
            AuditLogEntry.objects.bulk_update([entry], ["reason"])


@pytest.mark.django_db
class TestRequestCorrelationPropagation:
    @pytest.fixture(autouse=True)
    def clean_context(self):
        clear_trace_context()
        yield
        clear_trace_context()

    def test_http_context_captured_in_audit_log(self, user):
        request_id_ctx.set("req-abc")
        correlation_id_ctx.set("corr-xyz")

        entry = log_action(action="test.trace", actor=user)
        assert entry.request_id == "req-abc"
        assert entry.correlation_id == "corr-xyz"

    def test_management_command_propagates_trace(self):
        call_command("audit_retention")
        entry = AuditLogEntry.objects.filter(action="audit.retention_enforced").latest(
            "created_at"
        )
        assert entry.request_id
        assert entry.correlation_id
        assert entry.request_id == entry.correlation_id


@pytest.mark.django_db
class TestFailedLoginLogging:
    def test_login_failed_user_not_found(self):
        with pytest.raises(Exception):
            AuthService.login(
                email="missing@example.com",
                password="wrong",
                request_metadata={"ip_address": "127.0.0.1"},
            )
        assert AuditLogEntry.objects.filter(action="auth.login_failed").exists()

    def test_login_failed_wrong_password(self, user):
        user.set_password("correct")
        user.save()
        with pytest.raises(Exception):
            AuthService.login(
                email=user.email,
                password="wrong",
                request_metadata={"ip_address": "127.0.0.1"},
            )
        entry = AuditLogEntry.objects.filter(
            action="auth.login_failed", resource_id=str(user.id)
        ).latest("created_at")
        assert "Invalid password" in entry.reason


@pytest.mark.django_db
class TestPermissionDenialLogging:
    def test_permission_denial_audit(self, user):
        entry = log_permission_denial(
            actor=user,
            permission_codename="orders.create",
            resource_id="ord-1",
        )
        assert entry.action == "security.permission_denied"
        assert entry.metadata["permission_codename"] == "orders.create"


@pytest.mark.django_db
class TestRoleApprovalLogging:
    def test_role_change_approved_logs_audit(self, user):
        role = RoleDefinition.objects.create(name="Staff", slug="staff", hierarchy_level=60)
        superadmin_role = RoleDefinition.objects.create(
            name="Super Admin", slug="superadmin", hierarchy_level=100
        )
        approver = User.objects.create(email="sa@example.com")
        from apps.roles.models import UserRole

        UserRole.objects.create(user=approver, role=superadmin_role)

        from django.utils import timezone

        request = RoleChangeRequest.objects.create(
            initiator=user,
            target_user=user,
            requested_role=role,
            status=ApprovalRequestStatus.PENDING,
            expires_at=timezone.now() + timedelta(hours=48),
            reason="hire",
        )
        RoleService.approve_role_change(request, approver)
        assert AuditLogEntry.objects.filter(action="roles.change_request_approved").exists()


@pytest.mark.django_db(transaction=True)
class TestWebSocketAuditLogging:
    def test_websocket_auth_failed_logged(self):
        import asyncio

        async def _run():
            communicator = WebsocketCommunicator(application, "/ws/system/")
            connected, _ = await communicator.connect()
            assert connected is False
            await communicator.disconnect()

        asyncio.run(_run())

        assert AuditLogEntry.objects.filter(action="websocket.auth_failed").exists()
        entry = AuditLogEntry.objects.filter(action="websocket.auth_failed").latest(
            "created_at"
        )
        assert entry.metadata.get("close_code") == 4001
        assert entry.request_id

    def test_websocket_connect_success_logged(self, user, websocket_connect_permission):
        import asyncio

        role = RoleDefinition.objects.create(name="WS", slug="ws-user", hierarchy_level=10)
        RolePermission.objects.create(role=role, permission=websocket_connect_permission)
        UserRole.objects.create(user=user, role=role)

        async def _run():
            communicator = WebsocketCommunicator(
                SystemConsumer.as_asgi(), "/ws/system/"
            )
            communicator.scope["user"] = user
            connected, _ = await communicator.connect()
            assert connected is True
            await communicator.disconnect()

        asyncio.run(_run())

        assert AuditLogEntry.objects.filter(action="websocket.connect_success").exists()
        success = AuditLogEntry.objects.filter(
            action="websocket.connect_success"
        ).latest("created_at")
        assert success.actor == user
        assert AuditLogEntry.objects.filter(action="websocket.disconnect").exists()

    def test_websocket_permission_denied_logged(self, user):
        import asyncio

        async def _run():
            communicator = WebsocketCommunicator(
                SystemConsumer.as_asgi(), "/ws/system/"
            )
            communicator.scope["user"] = user
            connected, code = await communicator.connect()
            assert connected is False
            assert code == 4003

        asyncio.run(_run())
        assert AuditLogEntry.objects.filter(action="websocket.permission_denied").exists()

    def test_websocket_token_expired_logged(self):
        import asyncio

        async def _run():
            communicator = WebsocketCommunicator(
                SystemConsumer.as_asgi(), "/ws/system/"
            )
            communicator.scope["auth_failure_reason"] = "token_expired"
            connected, code = await communicator.connect()
            assert connected is False
            assert code == 4002
            await communicator.disconnect()

        asyncio.run(_run())
        assert AuditLogEntry.objects.filter(action="websocket.token_expired").exists()

    def test_websocket_connect_failed_logged(self, user, websocket_connect_permission):
        import asyncio
        from unittest.mock import patch

        role = RoleDefinition.objects.create(name="WS2", slug="ws-user-2", hierarchy_level=10)
        RolePermission.objects.create(role=role, permission=websocket_connect_permission)
        UserRole.objects.create(user=user, role=role)

        async def _run():
            with patch("apps.websocket.consumers.AsyncWebsocketConsumer.accept", side_effect=RuntimeError("fail")):
                communicator = WebsocketCommunicator(
                    SystemConsumer.as_asgi(), "/ws/system/"
                )
                communicator.scope["user"] = user
                with pytest.raises(RuntimeError):
                    await communicator.connect()

        asyncio.run(_run())
        assert AuditLogEntry.objects.filter(action="websocket.connect_failed").exists()


@pytest.mark.django_db
class TestAsyncTraceability:
    def test_celery_task_restores_trace_context(self):
        from core.trace_context import (
            TRACE_HEADER_CORRELATION_ID,
            TRACE_HEADER_REQUEST_ID,
        )

        request_id_ctx.set("http-req-1")
        correlation_id_ctx.set("http-corr-1")

        result = trace_probe.apply(
            headers={
                TRACE_HEADER_REQUEST_ID: "http-req-1",
                TRACE_HEADER_CORRELATION_ID: "http-corr-1",
            }
        ).get()
        assert result["request_id"] == "http-req-1"
        assert result["correlation_id"] == "http-corr-1"

    def test_celery_publish_injects_context_from_snapshot(self):
        request_id_ctx.set("pub-req-1")
        correlation_id_ctx.set("pub-corr-1")

        result = trace_probe.apply().get()
        assert result["request_id"] == "pub-req-1"
        assert result["correlation_id"] == "pub-corr-1"

    def test_audit_log_in_async_task_preserves_ids(self):
        from core.trace_context import TRACE_HEADER_REQUEST_ID, TRACE_HEADER_CORRELATION_ID
        
        rid = "task-req-123"
        cid = "task-corr-456"
        
        # We need a task that actually logs something
        @app.task(name="test.audit_task")
        def audit_task():
            return log_action(action="async.task_action")

        entry = audit_task.apply(
            headers={
                TRACE_HEADER_REQUEST_ID: rid,
                TRACE_HEADER_CORRELATION_ID: cid,
            }
        ).get()
        
        assert entry is not None
        assert entry.request_id == rid
        assert entry.correlation_id == cid

    def test_standalone_trace_for_commands(self):
        rid = bind_standalone_trace()
        try:
            entry = log_action(action="async.standalone")
            assert entry.request_id == rid
            assert entry.correlation_id == rid
        finally:
            clear_trace_context()


@pytest.mark.django_db
class TestGracefulDegradation:
    def test_log_action_survives_db_failure_non_critical(self, user):
        with patch(
            "apps.audit_logs.services.audit_service.AuditLogEntry.objects.create",
            side_effect=RuntimeError("db down"),
        ):
            result = log_action(action="websocket.disconnect", actor=user)
        assert result is None

    def test_log_action_fails_closed_critical(self, user):
        with patch(
            "apps.audit_logs.services.audit_service.AuditLogEntry.objects.create",
            side_effect=RuntimeError("db down"),
        ):
            with pytest.raises(AuditFailureError):
                log_action(action="security.test_fail_closed", actor=user)


@pytest.mark.django_db
class TestCacheInvalidationAudit:
    def test_invalidate_cache_logs_event(self, user):
        from apps.roles.services.permission_evaluator import invalidate_cache

        invalidate_cache(user.id)
        assert AuditLogEntry.objects.filter(action="rbac.cache_invalidated").exists()
