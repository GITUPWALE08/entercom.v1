import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.contrib.auth.models import AnonymousUser

class ChatConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.conversation_id = self.scope['url_route']['kwargs']['conversation_id']
        self.room_group_name = f'chat_{self.conversation_id}'

        # Check authentication (JWT middleware handles this and sets scope['user'])
        self.user = self.scope.get('user', AnonymousUser())
        if self.user.is_anonymous:
            await self.close(code=4403)
            return

        # Check participant access
        has_access = await self.check_participant_access(self.user, self.conversation_id)
        if not has_access:
            await self.close(code=4403)
            return

        # Join room group
        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )
        await self.accept()

    async def disconnect(self, close_code):
        # Leave room group
        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name
        )

    # Receive message from WebSocket (Clients shouldn't send messages over WS in MVP, use REST API, but handling ping/read is fine)
    async def receive(self, text_data):
        try:
            text_data_json = json.loads(text_data)
            action = text_data_json.get('action')
            
            if action == 'mark_read':
                await self.mark_conversation_read(self.user, self.conversation_id)
        except Exception:
            pass

    # Receive message from room group
    async def chat_message(self, event):
        # Send message to WebSocket
        await self.send(text_data=json.dumps({
            'type': 'message',
            'message_id': event.get('message_id'),
            'sender_id': event.get('sender_id'),
            'body': event.get('body'),
            'message_type': event.get('message_type'),
            'created_at': event.get('created_at'),
        }))

    async def user_read(self, event):
        await self.send(text_data=json.dumps({
            'type': 'read_receipt',
            'user_id': event.get('user_id'),
            'read_at': event.get('read_at'),
        }))

    @database_sync_to_async
    def check_participant_access(self, user, conversation_id):
        from .models import Conversation, ConversationParticipant
        try:
            conversation = Conversation.objects.get(id=conversation_id)
            if user.role in ['admin', 'manager', 'staff']:
                return True
            if user.role == 'technician':
                if conversation.request and getattr(conversation.request, 'assigned_to_id', None) == user.id:
                    return True
            return ConversationParticipant.objects.filter(conversation=conversation, user=user, is_active=True).exists()
        except Conversation.DoesNotExist:
            return False

    @database_sync_to_async
    def mark_conversation_read(self, user, conversation_id):
        from .services import ChatService
        from .models import Conversation
        try:
            conversation = Conversation.objects.get(id=conversation_id)
            ChatService.mark_read(conversation, user)
        except Conversation.DoesNotExist:
            pass
