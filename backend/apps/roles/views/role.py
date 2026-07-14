from rest_framework import viewsets, permissions
from apps.roles.models import RoleDefinition
from apps.roles.serializers.role import RoleDefinitionSerializer

class RoleViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = RoleDefinition.objects.filter(is_active=True)
    serializer_class = RoleDefinitionSerializer
    permission_classes = [permissions.IsAuthenticated]
