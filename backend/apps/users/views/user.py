from rest_framework import viewsets, permissions, status
from rest_framework.response import Response
from rest_framework.decorators import action
from django.contrib.auth import get_user_model
from drf_spectacular.utils import extend_schema

from apps.users.serializers.user import UserListSerializer, UserCreateSerializer, UserUpdateSerializer
from apps.users.services.user_service import UserService
from apps.authentication.services.auth_service import AuthService
from apps.roles.serializers.role import UserRoleSerializer, DeassignRoleSerializer
from apps.roles.services.role_service import RoleService
from core.exceptions import PermissionDeniedError

User = get_user_model()

class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all().prefetch_related('role_assignments__role')
    permission_classes = [permissions.IsAuthenticated]

    def get_serializer_class(self):
        if self.action == 'create':
            return UserCreateSerializer
        elif self.action in ['update', 'partial_update']:
            return UserUpdateSerializer
        return UserListSerializer

    def perform_create(self, serializer):
        UserService.create_user(
            email=serializer.validated_data['email'],
            first_name=serializer.validated_data['first_name'],
            last_name=serializer.validated_data['last_name'],
            actor=self.request.user
        )

    def perform_update(self, serializer):
        UserService.update_user(
            user=self.get_object(),
            data=serializer.validated_data,
            actor=self.request.user
        )

    def perform_destroy(self, instance):
        UserService.deactivate_user(user=instance, actor=self.request.user)

    @extend_schema(summary="Activate a user")
    @action(detail=True, methods=['post'])
    def activate(self, request, pk=None):
        user = self.get_object()
        UserService.activate_user(user=user, actor=request.user)
        return Response({'message': 'User activated successfully.'}, status=status.HTTP_200_OK)

    @extend_schema(summary="Deactivate a user")
    @action(detail=True, methods=['post'])
    def deactivate(self, request, pk=None):
        user = self.get_object()
        UserService.deactivate_user(user=user, actor=request.user)
        return Response({'message': 'User deactivated successfully.'}, status=status.HTTP_200_OK)

    @extend_schema(summary="Trigger password reset for a user")
    @action(detail=True, methods=['post'])
    def trigger_password_reset(self, request, pk=None):
        user = self.get_object()
        AuthService.request_password_reset(email=user.email)
        return Response({'message': 'Password reset triggered successfully.'}, status=status.HTTP_200_OK)

    @action(detail=False, methods=['get', 'patch'])
    def me(self, request):
        if request.method == 'GET':
            serializer = UserListSerializer(request.user)
            return Response(serializer.data)
        elif request.method == 'PATCH':
            serializer = UserUpdateSerializer(data=request.data, partial=True)
            serializer.is_valid(raise_exception=True)
            UserService.update_user(
                user=request.user,
                data=serializer.validated_data,
                actor=request.user
            )
            # Re-serialize updated user
            return Response(UserListSerializer(request.user).data)

    @action(detail=True, methods=['post'])
    def assign_role(self, request, pk=None):
        user = self.get_object()
        serializer = UserRoleSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        try:
            result = RoleService.assign_role(
                user=user,
                role_slug=serializer.validated_data['role_slug'],
                assigned_by=request.user,
                reason=serializer.validated_data.get('reason', '')
            )
            # If result is a RoleChangeRequest, it means it's pending approval
            if hasattr(result, 'status') and result.status == 'pending':
                return Response({'message': 'Role assignment requested and pending approval.'}, status=status.HTTP_202_ACCEPTED)
            
            return Response(UserRoleSerializer(result).data, status=status.HTTP_201_CREATED)
        except PermissionDeniedError as e:
            return Response({'detail': str(e)}, status=status.HTTP_403_FORBIDDEN)
        except Exception as e:
            return Response({'detail': str(e)}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['post'])
    def deassign_role(self, request, pk=None):
        user = self.get_object()
        serializer = DeassignRoleSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        try:
            RoleService.deactivate_role(
                user=user,
                role_slug=serializer.validated_data['role_slug'],
                deactivated_by=request.user
            )
            return Response({'message': 'Role deactivated successfully.'}, status=status.HTTP_200_OK)
        except PermissionDeniedError as e:
            return Response({'detail': str(e)}, status=status.HTTP_403_FORBIDDEN)
        except Exception as e:
            return Response({'detail': str(e)}, status=status.HTTP_400_BAD_REQUEST)
