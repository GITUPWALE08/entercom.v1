from typing import Dict, Set
from .constants import Role, Permission

ROLE_PERMISSIONS: Dict[Role, Set[Permission]] = {
    Role.CUSTOMER: {
        Permission.REQUEST_CREATE,
        Permission.REQUEST_SUBMIT,
        Permission.REQUEST_CANCEL,
        Permission.QUOTE_APPROVE,
        Permission.QUOTE_REJECT,
        Permission.QUOTE_REVISE,
    },
    Role.TECHNICIAN: {
        Permission.ASSIGNMENT_ACCEPT,
        Permission.ASSIGNMENT_DECLINE,
        Permission.REQUEST_UPDATE,
        Permission.QUOTE_CREATE,
        Permission.VERIFICATION_SUBMIT,
    },
    Role.STAFF: {
        Permission.REQUEST_TRIAGE,
        Permission.REQUEST_ASSIGN,
        Permission.REQUEST_CANCEL,
        Permission.QUOTE_CREATE,
        Permission.VERIFICATION_VERIFY,
    },
    Role.MANAGER: {
        Permission.REQUEST_ESCALATE,
        Permission.ESCALATION_RESOLVE,
        Permission.VERIFICATION_OVERRIDE,
        Permission.REQUEST_CANCEL_ACTIVE,
        Permission.REQUEST_CANCEL,
    },
    Role.SUPERADMIN: {
        Permission.SYSTEM_OVERRIDE,
    }
}

class PermissionRegistry:
    """Registry to query allowed permissions for specific roles."""
    
    @staticmethod
    def get_permissions_for_role(role: Role) -> Set[Permission]:
        """Returns all permissions granted to a given role."""
        return ROLE_PERMISSIONS.get(role, set())
    
    @staticmethod
    def role_has_permission(role: Role, permission: Permission) -> bool:
        """Checks if a role possesses a specific permission at the matrix level."""
        return permission in PermissionRegistry.get_permissions_for_role(role)
