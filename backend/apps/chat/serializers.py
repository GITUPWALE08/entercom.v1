from rest_framework import serializers
from .models import Conversation, ConversationParticipant, Message
from apps.users.serializers.user import UserListSerializer

class AttachmentSerializer(serializers.ModelSerializer):
    class Meta:
        from .models import Attachment
        model = Attachment
        fields = ['id', 'message', 'file', 'file_name', 'file_type', 'file_size', 'created_at']
        read_only_fields = fields

class ConversationParticipantSerializer(serializers.ModelSerializer):
    user = UserListSerializer(read_only=True)

    class Meta:
        model = ConversationParticipant
        fields = ['id', 'user', 'joined_at', 'last_read_at', 'is_active']
        read_only_fields = fields


class MessageSerializer(serializers.ModelSerializer):
    sender = UserListSerializer(read_only=True)
    attachments = serializers.SerializerMethodField()

    class Meta:
        model = Message
        fields = ['id', 'conversation', 'sender', 'body', 'message_type', 'created_at', 'edited_at', 'delivered_at', 'read_at', 'is_deleted', 'attachments']
        read_only_fields = ['id', 'conversation', 'sender', 'created_at', 'edited_at', 'delivered_at', 'read_at', 'is_deleted', 'attachments']

    def get_attachments(self, obj):
        from .models import Attachment
        return AttachmentSerializer(obj.attachments.all(), many=True).data

    def to_representation(self, instance):
        data = super().to_representation(instance)
        if instance.is_deleted:
            data['body'] = "This message was deleted."
        return data


class ConversationListSerializer(serializers.ModelSerializer):
    created_by = UserListSerializer(read_only=True)
    assigned_staff = UserListSerializer(read_only=True)
    unread_count = serializers.SerializerMethodField()
    last_message = serializers.SerializerMethodField()

    class Meta:
        model = Conversation
        fields = [
            'id', 'public_id', 'subject', 'status', 'conversation_type', 
            'request', 'booking', 'payment', 
            'created_by', 'assigned_staff', 
            'created_at', 'updated_at', 'resolved_at',
            'unread_count', 'last_message'
        ]

    def get_unread_count(self, obj):
        user = self.context['request'].user
        try:
            participant = obj.participants.get(user=user)
            return obj.messages.filter(created_at__gt=participant.last_read_at).count()
        except ConversationParticipant.DoesNotExist:
            return 0

    def get_last_message(self, obj):
        last_msg = obj.messages.order_by('-created_at').first()
        if last_msg:
            return MessageSerializer(last_msg).data
        return None


class ConversationDetailSerializer(ConversationListSerializer):
    participants = ConversationParticipantSerializer(many=True, read_only=True)

    class Meta(ConversationListSerializer.Meta):
        fields = ConversationListSerializer.Meta.fields + ['participants']


class ConversationCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Conversation
        fields = ['subject', 'conversation_type', 'request', 'booking', 'payment']
