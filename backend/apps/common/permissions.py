"""Reusable permission helpers for DRF and Channels (see docs/RBAC.md)."""


from enum import Enum
from typing import Any

class Role(Enum):
    CUSTOMER = 'customer'
    STAFF = 'staff'
    MANAGER = 'manager'
    SUPERADMIN = 'superadmin'
    SYSTEM = 'system'

class Actor:
    def __init__(self, id: Any, role: Role):
        self.id = id
        self.role = role

    @property
    def type(self) -> str:
        return 'system' if self.role == Role.SYSTEM else 'user'

class BasePermissionChecker:
    @staticmethod
    def has_role(actor: Actor, allowed_roles: list[Role]) -> bool:
        if actor.role == Role.SUPERADMIN:
            return True
        return actor.role in allowed_roles

    @staticmethod
    def require_role(actor: Actor, allowed_roles: list[Role], error_msg="Permission denied."):
        if not BasePermissionChecker.has_role(actor, allowed_roles):
            from django.core.exceptions import PermissionDenied
            raise PermissionDenied(error_msg)
