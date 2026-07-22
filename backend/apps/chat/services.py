import uuid
from django.utils import timezone
from django.db import transaction
from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer
from .models import Conversation, ConversationParticipant, Message, ConversationStatus
from apps.notification.services import DispatchOrchestrator

class ChatService:
    @staticmethod
    def create_conversation(user, data):
        with transaction.atomic():
            conversation = Conversation.objects.create(
                subject=data.get('subject'),
                conversation_type=data.get('conversation_type', 'support'),
                request=data.get('request'),
                booking=data.get('booking'),
                payment=data.get('payment'),
                created_by=user
            )
            # Add creator as participant
            ConversationParticipant.objects.create(
                conversation=conversation,
                user=user
            )
            return conversation

    @staticmethod
    def send_message(conversation, sender, body, message_type='text'):
        if conversation.status == 'closed':
            raise ValueError("Cannot send messages in a closed conversation.")
            
        with transaction.atomic():
            message = Message.objects.create(
                conversation=conversation,
                sender=sender,
                body=body,
                message_type=message_type
            )
            
            # Ensure sender is a participant
            participant, created = ConversationParticipant.objects.get_or_create(
                conversation=conversation,
                user=sender
            )
            participant.last_read_at = timezone.now()
            participant.save()
            
            # Broadcast via websockets
            channel_layer = get_channel_layer()
            async_to_sync(channel_layer.group_send)(
                f"chat_{conversation.id}",
                {
                    'type': 'chat_message',
                    'message_id': str(message.id),
                    'sender_id': str(sender.id) if sender else None,
                    'body': body,
                    'message_type': message_type,
                    'created_at': message.created_at.isoformat()
                }
            )
            
            # Send notification via DispatchOrchestrator
            # Notify all participants except the sender
            participant_ids = list(conversation.participants.exclude(user=sender).values_list('user_id', flat=True))
            if participant_ids:
                transaction.on_commit(lambda: DispatchOrchestrator.dispatch_event(
                    event_name="support_message_received",
                    context={
                        "conversation_id": str(conversation.id),
                        "public_id": conversation.public_id,
                        "subject": conversation.subject,
                        "message_body": body[:100] + "..." if len(body) > 100 else body,
                        "sender_name": sender.get_full_name() if sender else "System"
                    },
                    recipients=participant_ids
                ))
                
            return message

    @staticmethod
    def mark_read(conversation, user):
        participant, created = ConversationParticipant.objects.get_or_create(
            conversation=conversation,
            user=user
        )
        participant.last_read_at = timezone.now()
        participant.save()
        
        channel_layer = get_channel_layer()
        async_to_sync(channel_layer.group_send)(
            f"chat_{conversation.id}",
            {
                'type': 'user_read',
                'user_id': str(user.id),
                'read_at': participant.last_read_at.isoformat()
            }
        )
        return participant

    @staticmethod
    def assign_staff(conversation, staff_user, assigned_by):
        with transaction.atomic():
            conversation.assigned_staff = staff_user
            conversation.save()
            
            ConversationParticipant.objects.get_or_create(
                conversation=conversation,
                user=staff_user
            )
            
            # System message
            ChatService.send_message(
                conversation, 
                None, 
                f"Conversation assigned to {staff_user.get_full_name()}.",
                message_type='system'
            )
            return conversation

    @staticmethod
    def resolve_conversation(conversation, resolved_by):
        with transaction.atomic():
            conversation.status = ConversationStatus.RESOLVED
            conversation.resolved_at = timezone.now()
            conversation.save()
            
            # System message
            ChatService.send_message(
                conversation, 
                None, 
                f"Conversation resolved by {resolved_by.get_full_name()}.",
                message_type='system'
            )
            return conversation
