import json
import asyncio
from asgiref.sync import sync_to_async
from channels.generic.websocket import AsyncWebsocketConsumer
from django.conf import settings
from django.utils import timezone
from rest_framework_simplejwt.tokens import AccessToken
from rest_framework_simplejwt.exceptions import TokenError
from django.contrib.auth import get_user_model

User = get_user_model()

class AuthenticationService:
    @staticmethod
    @sync_to_async
    def validate_first_frame_token(token: str):
        try:
            access = AccessToken(token)
            user_id = access.get("user_id")
            if not user_id:
                return None
            user = User.objects.get(pk=user_id)
            if not user.is_active:
                return None
            return user
        except (TokenError, User.DoesNotExist):
            return None


class SubscriptionManager:
    def __init__(self, consumer):
        self.consumer = consumer
        self.active_groups = set()

    async def subscribe_implicit(self, user):
        """Subscribe to personal channels instantly after auth."""
        groups = [
            f"user.{user.id}.notifications",
            f"user.{user.id}.system",
        ]
        if hasattr(user, 'role') and user.role:
            groups.append(f"role.{user.role}.alerts")
            
        for g in groups:
            await self.consumer.channel_layer.group_add(g, self.consumer.channel_name)
            self.active_groups.add(g)

    async def subscribe_explicit(self, channel_name):
        await self.consumer.channel_layer.group_add(channel_name, self.consumer.channel_name)
        self.active_groups.add(channel_name)

    async def unsubscribe(self, channel_name):
        if channel_name in self.active_groups:
            await self.consumer.channel_layer.group_discard(channel_name, self.consumer.channel_name)
            self.active_groups.remove(channel_name)

    async def cleanup(self):
        for g in self.active_groups:
            await self.consumer.channel_layer.group_discard(g, self.consumer.channel_name)
        self.active_groups.clear()


class AuthorizationService:
    @staticmethod
    @sync_to_async
    def can_subscribe(user, channel_name: str) -> bool:
        # e.g. "resource.request.1024"
        parts = channel_name.split('.')
        if len(parts) == 3 and parts[0] == 'resource':
            return True
        return False


class HeartbeatManager:
    def __init__(self, consumer):
        self.consumer = consumer
        self.last_ping = timezone.now()
        self.timeout_task = None
        
    def ping_received(self):
        self.last_ping = timezone.now()
        
    async def monitor(self):
        # 60s timeout loop (2 missed 30s heartbeats)
        while True:
            await asyncio.sleep(10)
            if (timezone.now() - self.last_ping).total_seconds() > 60:
                await self.consumer.close(code=4000)
                break


class PresenceService:
    @staticmethod
    def mark_online(user_id):
        # Scoped to shared resources only.
        pass

    @staticmethod
    def mark_offline(user_id):
        pass


class EventRoutingService:
    @staticmethod
    def publish(channel_name: str, payload: dict):
        from channels.layers import get_channel_layer
        from asgiref.sync import async_to_sync
        
        layer = get_channel_layer()
        async_to_sync(layer.group_send)(
            channel_name,
            {
                "type": "broadcast.message",
                "payload": payload
            }
        )


class RedisBackplaneConfig:
    pass


class ConnectionManager(AsyncWebsocketConsumer):
    """
    Main ASGI Consumer implementing Phase 6 First-Frame Authentication,
    Heartbeats, and Subscription routing.
    """
    async def connect(self):
        self.authenticated = False
        self.subscription_manager = SubscriptionManager(self)
        self.heartbeat_manager = HeartbeatManager(self)
        await self.accept()
        
        # Start a 5 second timeout for first frame auth
        self.auth_timeout_task = asyncio.create_task(self._auth_timeout())

    async def _auth_timeout(self):
        await asyncio.sleep(5)
        if not self.authenticated:
            await self.close(code=4001)

    async def disconnect(self, close_code):
        if hasattr(self, 'subscription_manager'):
            await self.subscription_manager.cleanup()
        if hasattr(self, 'auth_timeout_task'):
            self.auth_timeout_task.cancel()
        if hasattr(self, 'heartbeat_manager') and getattr(self.heartbeat_manager, 'timeout_task', None):
            self.heartbeat_manager.timeout_task.cancel()

    async def receive(self, text_data=None, bytes_data=None):
        if not text_data:
            return
            
        # 64 KB Max Frame Size Protection
        if len(text_data) > 65536:
            await self.close(code=1009)
            return

        try:
            data = json.loads(text_data)
        except ValueError:
            await self.send(text_data=json.dumps({"error": "malformed_json"}))
            return

        command = data.get("type")
        
        # 1. First Frame Auth Check
        if not self.authenticated:
            if command == "authenticate":
                token = data.get("token")
                user = await AuthenticationService.validate_first_frame_token(token)
                if user:
                    self.authenticated = True
                    self.user = user
                    self.auth_timeout_task.cancel()
                    await self.subscription_manager.subscribe_implicit(self.user)
                    self.heartbeat_manager.timeout_task = asyncio.create_task(self.heartbeat_manager.monitor())
                    await self.send(text_data=json.dumps({"type": "system_ack", "status": "authenticated"}))
                else:
                    await self.close(code=4001)
            else:
                await self.close(code=4001)
            return

        # 2. Heartbeat Ping
        if command == "ping":
            self.heartbeat_manager.ping_received()
            await self.send(text_data=json.dumps({"type": "pong"}))
            return

        # 3. Explicit Subscription
        if command == "subscribe":
            channel_name = data.get("channel")
            if await AuthorizationService.can_subscribe(self.user, channel_name):
                await self.subscription_manager.subscribe_explicit(channel_name)
                await self.send(text_data=json.dumps({"type": "system_ack", "channel": channel_name}))
            else:
                await self.send(text_data=json.dumps({"type": "error", "message": "unauthorized"}))
            return

    async def broadcast_message(self, event):
        """
        Handler for Redis Backplane messages.
        """
        payload = event.get("payload", {})
        await self.send(text_data=json.dumps({
            "type": "data",
            "payload": payload
        }))
