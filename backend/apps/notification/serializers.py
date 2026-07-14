from rest_framework import serializers
from .models import Notification, NotificationPreference

class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = [
            'id', 'category', 'event_type', 'title', 'message', 
            'context', 'resource_type', 'resource_id', 'status', 
            'created_at', 'read_at'
        ]
        read_only_fields = fields

class NotificationPreferenceSerializer(serializers.ModelSerializer):
    class Meta:
        model = NotificationPreference
        fields = ['id', 'category', 'channel', 'is_enabled']
        read_only_fields = ['id']
