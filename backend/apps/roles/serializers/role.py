from rest_framework import serializers
from apps.roles.models import RoleDefinition, UserRole

class RoleDefinitionSerializer(serializers.ModelSerializer):
    class Meta:
        model = RoleDefinition
        fields = ['id', 'name', 'slug', 'description', 'hierarchy_level', 'is_active']

class UserRoleSerializer(serializers.ModelSerializer):
    role = RoleDefinitionSerializer(read_only=True)
    role_slug = serializers.CharField(write_only=True)
    reason = serializers.CharField(write_only=True, required=False, allow_blank=True)

    class Meta:
        model = UserRole
        fields = ['id', 'user', 'role', 'role_slug', 'assigned_by', 'reason', 'is_active', 'created_at']
        read_only_fields = ['id', 'user', 'assigned_by', 'is_active', 'created_at']

class DeassignRoleSerializer(serializers.Serializer):
    role_slug = serializers.CharField()
