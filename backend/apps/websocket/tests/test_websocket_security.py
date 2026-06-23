import pytest
from channels.testing import WebsocketCommunicator
from django.contrib.auth.models import AnonymousUser
from asgiref.sync import sync_to_async
from apps.audit_logs.models import AuditLogEntry
from apps.websocket.consumers import SystemConsumer, WS_CLOSE_AUTH_FAILED
from apps.websocket.middleware.jwt_auth import JWTAuthMiddleware
import json

@pytest.mark.anyio
@pytest.mark.django_db(transaction=True)
class TestWebSocketSecurity:
    """
    Verifies that unauthenticated WebSocket connections are rejected and audited.
    """

    async def test_unauthenticated_connection_rejected_and_audited(self):
        # 1. Wrap the consumer with JWTAuthMiddleware to simulate production stack
        application = JWTAuthMiddleware(SystemConsumer.as_asgi())
        
        # 2. Initialize communicator with a client IP
        communicator = WebsocketCommunicator(
            application, 
            "ws/system/",
            headers=[(b"user-agent", b"TestAgent")]
        )
        # Manually set client in scope as WebsocketCommunicator might not do it
        communicator.scope["client"] = ("127.0.0.1", 12345)
        
        # 3. Attempt connection
        connected, subprotocol = await communicator.connect()
        
        # 4. Verify connection was rejected by the server
        assert connected is False
        
        # 5. Verify Audit Log entry exists
        @sync_to_async
        def get_audit_log():
            return AuditLogEntry.objects.filter(
                action="websocket.auth_failed",
                resource_type="websocket"
            ).first()
        
        entry = await get_audit_log()
        assert entry is not None
        assert entry.reason == "Unauthenticated connection"
        assert entry.metadata["close_code"] == WS_CLOSE_AUTH_FAILED
        
        # Check model fields
        assert entry.request_id is not None
        assert entry.ip_address == "127.0.0.1"
        assert entry.user_agent == "TestAgent"

    async def test_authenticated_connection_success_audited(self):
        # Setup: Create user with websocket.connect permission
        from django.contrib.auth import get_user_model
        from apps.roles.models import RoleDefinition, UserRole
        from rest_framework_simplejwt.tokens import RefreshToken
        
        User = get_user_model()
        
        @sync_to_async
        def setup_user():
            user = User.objects.create_user(
                email="ws_user@example.com", 
                password="password",
                first_name="WS",
                last_name="User"
            )
            role = RoleDefinition.objects.get_or_create(slug="ws_role", name="WS Role")[0]
            UserRole.objects.create(user=user, role=role)
            
            # Create token with role_version to match AuthService.login
            refresh = RefreshToken.for_user(user)
            refresh["role_version"] = user.role_version
            access = refresh.access_token
            access["role_version"] = user.role_version
            
            return user, str(access)
        
        user, token = await setup_user()
        
        # Mock has_permission to return True
        with pytest.MonkeyPatch().context() as m:
            m.setattr("apps.websocket.consumers.has_permission", lambda u, p: True)
            
            application = JWTAuthMiddleware(SystemConsumer.as_asgi())
            communicator = WebsocketCommunicator(
                application, 
                f"ws/system/?token={token}",
                headers=[(b"user-agent", b"TestAgentAuthenticated")]
            )
            communicator.scope["client"] = ("127.0.0.1", 12345)
            
            connected, _ = await communicator.connect()
            assert connected is True
            
            # Receive welcome message
            response = await communicator.receive_from()
            assert "system.connected" in json.loads(response)["event"]
            
            await communicator.disconnect()
            
            @sync_to_async
            def verify_audit():
                return AuditLogEntry.objects.filter(
                    action="websocket.connect_success",
                    actor=user
                ).first()
            
            entry = await verify_audit()
            assert entry is not None
            assert entry.ip_address == "127.0.0.1"
            assert entry.user_agent == "TestAgentAuthenticated"
