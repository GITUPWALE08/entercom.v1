from typing import Optional, Protocol
from .constants import Role, Permission
from .matrix import PermissionRegistry

class ResourceInterface(Protocol):
    """Protocol defining the required properties of a request resource for RBAC checks."""
    owner_id: Optional[int]
    assigned_technician_id: Optional[int]

class RBACChecker:
    """Utilities for verifying ownership, assignment, and state-aware permissions."""
    
    @staticmethod
    def is_owner(user_id: int, resource_owner_id: Optional[int]) -> bool:
        """Validates if the user is the explicit owner of the resource."""
        if resource_owner_id is None:
            return False
        return user_id == resource_owner_id

    @staticmethod
    def is_assigned_technician(user_id: int, technician_id: Optional[int]) -> bool:
        """Validates if the user is the currently assigned technician."""
        if technician_id is None:
            return False
        return user_id == technician_id

    @staticmethod
    def can_manager_override(role: Role) -> bool:
        """Validates if the user's role has manager override authority."""
        return role in {Role.MANAGER, Role.SUPERADMIN}

    @staticmethod
    def check_scoped_permission(
        role: Role, 
        permission: Permission, 
        user_id: int, 
        resource: Optional[ResourceInterface] = None
    ) -> bool:
        """
        Validates if a user has a permission, enforcing ownership and 
        assignment scopes as defined in the RBAC mapping.
        """
        # 1. Check if the role is globally allowed the permission
        if not PermissionRegistry.role_has_permission(role, permission):
            return False
            
        # 2. Check the scope of the role
        if role == Role.CUSTOMER:
            # Customers only act on "Owned" scope
            if resource is not None:
                return RBACChecker.is_owner(user_id, getattr(resource, 'customer_id', None))
            # If no resource is provided, they can only create
            return permission == Permission.REQUEST_CREATE
            
        elif role == Role.TECHNICIAN:
            # Technicians only act on "Assigned" scope
            if resource is not None:
                return RBACChecker.is_assigned_technician(user_id, resource.assigned_technician_id)
            return False # Technicians cannot act without a bound resource
            
        elif role in {Role.STAFF, Role.MANAGER}:
            # Staff and Managers operate on "Global" scope
            return True
            
        elif role == Role.SUPERADMIN:
            # Superadmin operates on "Universal" scope
            return True

        return False

    @staticmethod
    def check_state_aware_cancellation(role: Role, is_active: bool, is_owner: bool) -> bool:
        """
        Validates cancellation boundaries based on role, state, and ownership.
        
        Args:
            role: The actor's role.
            is_active: True if the request is assigned, in_progress, or pending_verification.
            is_owner: True if the actor is the customer who owns the request.
        """
        if role == Role.CUSTOMER:
            # Blocked once assigned or in_progress
            return is_owner and not is_active
            
        elif role == Role.STAFF:
            # Staff freely cancels before assignment; after requires manager approval
            return not is_active
            
        elif role == Role.MANAGER:
            # Managers hold ultimate cancellation authority for active items
            return True
            
        return False
