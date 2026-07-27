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
        
        protocol = dict(self.scope.get('headers', [])).get(b'sec-websocket-protocol', b'').decode('utf-8')
        if protocol:
            await self.accept(subprotocol=protocol.split(',')[0].strip())
        else:
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
            elif action == 'mark_delivered':
                message_id = text_data_json.get('message_id')
                if message_id:
                    await self.mark_message_delivered(message_id)
            elif action in ['typing_start', 'typing_stop']:
                await self.channel_layer.group_send(
                    self.room_group_name,
                    {
                        'type': 'user_typing',
                        'action': action,
                        'user_id': str(self.user.id),
                        'user_name': self.user.get_full_name()
                    }
                )
            elif action in ['presence_online', 'presence_offline']:
                await self.channel_layer.group_send(
                    self.room_group_name,
                    {
                        'type': 'user_presence',
                        'action': action,
                        'user_id': str(self.user.id)
                    }
                )
        except Exception:
            pass

    # Receive message from room group
    async def chat_message(self, event):
        # Send message to WebSocket
        await self.send(text_data=json.dumps({
            'type': 'message',
            'message': event.get('message')
        }))

    async def message_delivered(self, event):
        await self.send(text_data=json.dumps({
            'type': 'message_delivered',
            'message_id': event.get('message_id'),
            'delivered_at': event.get('delivered_at'),
        }))

    async def user_read(self, event):
        await self.send(text_data=json.dumps({
            'type': 'read_receipt',
            'user_id': event.get('user_id'),
            'read_at': event.get('read_at'),
        }))
        
    async def user_typing(self, event):
        await self.send(text_data=json.dumps({
            'type': event['action'],
            'user_id': event['user_id'],
            'user_name': event['user_name']
        }))
        
    async def user_presence(self, event):
        await self.send(text_data=json.dumps({
            'type': event['action'],
            'user_id': event['user_id']
        }))

    async def message_updated(self, event):
        await self.send(text_data=json.dumps({
            'type': 'message_updated',
            'message_id': event.get('message_id'),
            'body': event.get('body'),
            'edited_at': event.get('edited_at'),
        }))

    async def message_deleted(self, event):
        await self.send(text_data=json.dumps({
            'type': 'message_deleted',
            'message_id': event.get('message_id'),
        }))

    @database_sync_to_async
    def check_participant_access(self, user, conversation_id):
        from .models import Conversation, ConversationParticipant
        try:
            conversation = Conversation.objects.get(id=conversation_id)
            if user.role.lower() in ['admin', 'manager', 'staff', 'super_admin']:
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

    @database_sync_to_async
    def mark_message_delivered(self, message_id):
        from .models import Message
        from django.utils import timezone
        from channels.layers import get_channel_layer
        from asgiref.sync import async_to_sync
        try:
            msg = Message.objects.get(id=message_id)
            if not msg.delivered_at:
                msg.delivered_at = timezone.now()
                msg.save(update_fields=['delivered_at'])
                
                channel_layer = get_channel_layer()
                # Broadcast delivered status
                async_to_sync(channel_layer.group_send)(
                    f"chat_{msg.conversation.id}",
                    {
                        'type': 'message_delivered',
                        'message_id': str(msg.id),
                        'delivered_at': msg.delivered_at.isoformat()
                    }
                )
        except Message.DoesNotExist:
            pass
