from rest_framework.permissions import BasePermission
from django.core.exceptions import ImproperlyConfigured
from ..permissions import RBACChecker, Permission, Role
from typing import Protocol, Optional

class UserProtocol(Protocol):
    role: str
    id: int

class RequestResourceInterface(Protocol):
    customer_id: Optional[int]
    assigned_technician_id: Optional[int]

class GenericRBACPermission(BasePermission):
    """
    Generic permission class to validate action against RBAC mapping.
    It expects the view to define `rbac_action_map`.
    """
    def _get_required_permission(self, request, view):
        action_map = getattr(view, "rbac_action_map", {})
        mapped_val = action_map.get(view.action)

        if isinstance(mapped_val, dict):
            # Dynamic lookup based on payload 'action'
            payload_action = request.data.get('action')
            return mapped_val.get(payload_action)
        return mapped_val

    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
            
        required_perm = self._get_required_permission(request, view)
        
        # 'list' and 'retrieve' bypass specific RBAC create/mutate permissions here.
        # Ownership filtering is handled in get_queryset / list methods.
        if view.action in ['list', 'retrieve', 'timeline'] or not required_perm:
            return True

        # If it's a creation at the root level, check without resource
        if view.action == 'create' and 'request_pk' not in view.kwargs:
            return RBACChecker.check_scoped_permission(
                role=Role(request.user.role), 
                permission=required_perm, 
                user_id=request.user.id
            )
        return True
        
    def has_object_permission(self, request, view, obj):
        if not request.user or not request.user.is_authenticated:
            return False
            
        required_perm = self._get_required_permission(request, view)
        if not required_perm:
            return True

        return RBACChecker.check_scoped_permission(
            role=Role(request.user.role), 
            permission=required_perm, 
            user_id=request.user.id,
            resource=obj
        )

class IsManagerOrSuperAdmin(BasePermission):
    """Specific check for overrides or manager-only actions."""
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        return RBACChecker.can_manager_override(Role(request.user.role))
