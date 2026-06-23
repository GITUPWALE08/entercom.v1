from apps.common.permissions import BasePermissionChecker, Role, Actor
from django.core.exceptions import PermissionDenied

class ProductPermissions:
    VIEW = 'product.view'
    CREATE = 'product.create'
    UPDATE = 'product.update'
    ARCHIVE = 'product.archive'

class CategoryPermissions:
    VIEW = 'category.view'
    CREATE = 'category.create'
    UPDATE = 'category.update'
    ARCHIVE = 'category.archive'

class InventoryPermissions:
    VIEW = 'inventory.view'
    ADJUST = 'inventory.adjust'
    MANAGE = 'inventory.manage'

class ProductPermissionChecker(BasePermissionChecker):
    @classmethod
    def check(cls, actor: Actor, permission: str, resource=None):
        if permission in [ProductPermissions.VIEW, CategoryPermissions.VIEW]:
            cls.require_role(actor, [Role.CUSTOMER, Role.STAFF, Role.MANAGER, Role.SUPERADMIN])
            return True
            
        elif permission in [ProductPermissions.CREATE, ProductPermissions.UPDATE, CategoryPermissions.CREATE, CategoryPermissions.UPDATE]:
            cls.require_role(actor, [Role.STAFF, Role.MANAGER, Role.SUPERADMIN])
            return True
            
        elif permission in [ProductPermissions.ARCHIVE, CategoryPermissions.ARCHIVE, InventoryPermissions.MANAGE]:
            cls.require_role(actor, [Role.MANAGER, Role.SUPERADMIN])
            return True
            
        elif permission in [InventoryPermissions.VIEW, InventoryPermissions.ADJUST]:
            cls.require_role(actor, [Role.STAFF, Role.MANAGER, Role.SUPERADMIN])
            return True
            
        raise PermissionDenied(f"Unknown permission or access denied: {permission}")
