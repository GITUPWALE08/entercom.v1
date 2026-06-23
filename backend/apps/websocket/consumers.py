import json

from channels.generic.websocket import AsyncWebsocketConsumer

from apps.audit_logs.services.websocket_audit import alog_websocket_event
from apps.roles.services.permission_evaluator import has_permission
from asgiref.sync import sync_to_async
from apps.requests.permissions.checks import RBACChecker
from apps.requests.permissions.constants import Role
from django.core.serializers.json import DjangoJSONEncoder


WS_CLOSE_AUTH_FAILED = 4001
WS_CLOSE_PERMISSION_DENIED = 4003
WS_CLOSE_TOKEN_EXPIRED = 4002

WEBSOCKET_CONNECT_PERMISSION = "websocket.connect"


class SystemConsumer(AsyncWebsocketConsumer):
    """Foundation connectivity check — domain namespaces follow docs/architecture/websocket.md."""

    async def connect(self):
        user = self.scope.get("user")
        auth_failure = self.scope.get("auth_failure_reason")

        if auth_failure == "token_expired":
            await alog_websocket_event(
                "websocket.token_expired",
                self.scope,
                reason="JWT expired",
                close_code=WS_CLOSE_TOKEN_EXPIRED,
            )
            await self.close(code=WS_CLOSE_TOKEN_EXPIRED)
            return
        
        if auth_failure == "permissions_changed":

            await alog_websocket_event(
                "websocket.permissions_changed",
                self.scope,
                reason="Role version mismatch",
                close_code=4004,
            )

            await self.close(code=4004)

            return

        if not user or not user.is_authenticated:
            await alog_websocket_event(
                "websocket.auth_failed",
                self.scope,
                reason="Unauthenticated connection",
                close_code=WS_CLOSE_AUTH_FAILED,
            )
            await self.close(code=WS_CLOSE_AUTH_FAILED)
            return

        from asgiref.sync import sync_to_async
        has_perm = await sync_to_async(has_permission)(user, WEBSOCKET_CONNECT_PERMISSION)

        if not has_perm:
            await alog_websocket_event(
                "websocket.permission_denied",
                self.scope,
                actor=user,
                resource_id=str(user.pk),
                reason=f"Missing permission: {WEBSOCKET_CONNECT_PERMISSION}",
                close_code=WS_CLOSE_PERMISSION_DENIED,
            )
            await self.close(code=WS_CLOSE_PERMISSION_DENIED)
            return

        try:
            await self.accept()
        except Exception:
            await alog_websocket_event(
                "websocket.connect_failed",
                self.scope,
                actor=user,
                resource_id=str(user.pk),
                reason="Handshake accept failed",
            )
            raise

        await alog_websocket_event(
            "websocket.connect_success",
            self.scope,
            actor=user,
            resource_id=str(user.pk),
        )
        await self.send(
            text_data=json.dumps(
                {"event": "system.connected", "version": 1, "payload": {}}
            )
        )

    async def disconnect(self, close_code):
        user = self.scope.get("user")
        actor = user if user and user.is_authenticated else None
        await alog_websocket_event(
            "websocket.disconnect",
            self.scope,
            actor=actor,
            resource_id=str(actor.pk) if actor else None,
            close_code=close_code,
        )

    async def receive(self, text_data=None, bytes_data=None):
        return None

class RequestConsumer(AsyncWebsocketConsumer):
    """
    Handles real-time Request Lifecycle updates.
    Route: ws/requests/
    """
    async def connect(self):
        self.user = self.scope.get("user")
        auth_failure = self.scope.get("auth_failure_reason")

        if auth_failure or not self.user or not self.user.is_authenticated:
            await self.close(code=WS_CLOSE_AUTH_FAILED)
            return

        self.subscribed_groups = set()
        
        # Join role-based groups
        role = getattr(self.user, 'role', '')
        if role == Role.CUSTOMER:
            group_name = f"customer_{self.user.id}"
            await self.channel_layer.group_add(group_name, self.channel_name)
            self.subscribed_groups.add(group_name)
        elif role == Role.TECHNICIAN:
            group_name = f"technician_{self.user.id}"
            await self.channel_layer.group_add(group_name, self.channel_name)
            self.subscribed_groups.add(group_name)
        elif role in [Role.STAFF]:
            await self.channel_layer.group_add("staff", self.channel_name)
            self.subscribed_groups.add("staff")
        elif role in [Role.MANAGER, Role.SUPERADMIN]:
            await self.channel_layer.group_add("manager", self.channel_name)
            self.subscribed_groups.add("manager")

        await self.accept()

    async def disconnect(self, close_code):
        for group_name in self.subscribed_groups:
            await self.channel_layer.group_discard(group_name, self.channel_name)

    async def receive(self, text_data=None, bytes_data=None):
        """
        Handle explicit subscriptions to single requests.
        Payload: {"action": "subscribe", "request_id": "REQ-123" or 101}
        """
        if not text_data:
            return
            
        try:
            data = json.loads(text_data)
            action = data.get("action")
            req_id = data.get("request_id")
            
            if action == "subscribe" and req_id:
                # Security Check
                is_authorized = await self._is_authorized_for_request(req_id)
                if is_authorized:
                    group_name = f"request_{req_id}"
                    await self.channel_layer.group_add(group_name, self.channel_name)
                    self.subscribed_groups.add(group_name)
                    await self.send(json.dumps({"success": True, "message": f"Subscribed to request_{req_id}"}))
                else:
                    await self.send(json.dumps({"success": False, "error": "permission_denied"}))
                    
        except json.JSONDecodeError:
            pass

    @sync_to_async
    def _is_authorized_for_request(self, req_id):
        from apps.requests.models import Request
        try:
            req = Request.objects.get(pk=req_id)
        except Request.DoesNotExist:
            return False
            
        role = Role(self.user.role)
        if role == Role.CUSTOMER:
            return RBACChecker.is_owner(self.user.id, req.customer_id)
        elif role == Role.TECHNICIAN:
            return RBACChecker.is_assigned_technician(self.user.id, req.assigned_technician_id)
        elif role in [Role.STAFF, Role.MANAGER, Role.SUPERADMIN]:
            return True
            
        return False

    async def request_event(self, event):
        """
        Fired when channel_layer.group_send is called with type="request_event"
        """
        request_id = event.get("request_id")
        
        if request_id:
            is_authorized = await self._is_authorized_for_request(request_id)
            if not is_authorized:
                group_name = f"request_{request_id}"
                if group_name in self.subscribed_groups:
                    await self.channel_layer.group_discard(group_name, self.channel_name)
                    self.subscribed_groups.remove(group_name)
                return

        payload = {
            "event": event.get("event"),
            "version": event.get("version", 1),
            "timestamp": event.get("timestamp"),
            "request_id": request_id,
            "payload": event.get("payload", {})
        }
        await self.send(text_data=json.dumps(payload, cls=DjangoJSONEncoder))
