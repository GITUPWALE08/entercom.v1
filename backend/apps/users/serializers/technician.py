from rest_framework import serializers
from apps.users.models import TechnicianApplication

class TechnicianApplicationSerializer(serializers.ModelSerializer):
    user_email = serializers.EmailField(source='user.email', read_only=True)
    first_name = serializers.CharField(source='user.first_name', read_only=True)
    last_name = serializers.CharField(source='user.last_name', read_only=True)

    class Meta:
        model = TechnicianApplication
        fields = ['id', 'user_email', 'first_name', 'last_name', 'skills', 'form_data', 'status', 'document_urls', 'notes', 'created_at', 'updated_at']
        read_only_fields = ['id', 'status', 'created_at', 'updated_at']

class TechnicianApplicationCreateSerializer(serializers.Serializer):
    skills = serializers.ListField(child=serializers.CharField(), required=False, default=list)
    document_urls = serializers.ListField(child=serializers.CharField(), required=False, default=list)
    form_data = serializers.JSONField(required=False, default=dict)
    notes = serializers.CharField(required=False, allow_blank=True, default="")

class TechnicianApplicationDecideSerializer(serializers.Serializer):
    status = serializers.ChoiceField(choices=['approved', 'rejected'])
