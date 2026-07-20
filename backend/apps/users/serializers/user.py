from rest_framework import serializers
from django.contrib.auth import get_user_model
from apps.roles.serializers.role import UserRoleSerializer

User = get_user_model()

class UserListSerializer(serializers.ModelSerializer):
    role_assignments = UserRoleSerializer(many=True, read_only=True)

    class Meta:
        model = User
        fields = ['id', 'email', 'first_name', 'last_name', 'phone_number', 'address', 'profile_image', 'mfa_enabled', 'is_active', 'created_at', 'role_assignments']

class UserCreateSerializer(serializers.Serializer):
    email = serializers.EmailField()
    first_name = serializers.CharField(max_length=150)
    last_name = serializers.CharField(max_length=150)

class UserUpdateSerializer(serializers.Serializer):
    first_name = serializers.CharField(max_length=150, required=False)
    last_name = serializers.CharField(max_length=150, required=False)
    phone_number = serializers.CharField(max_length=32, required=False, allow_blank=True)
    address = serializers.CharField(required=False, allow_blank=True)
    profile_image = serializers.URLField(max_length=500, required=False, allow_blank=True)
    mfa_enabled = serializers.BooleanField(required=False)
