from apps.common.permissions import BasePermissionChecker, Role, Actor
from django.core.exceptions import PermissionDenied

class OrderPermissions:
    CREATE = 'order.create'
    VIEW_OWN = 'order.view_own'
    VIEW = 'order.view'
    CANCEL = 'order.cancel'
    FULFILL = 'order.fulfill'
    OVERRIDE_FULFILLMENT = 'order.override_fulfillment'

class OrderPermissionChecker(BasePermissionChecker):
    @classmethod
    def check(cls, actor: Actor, permission: str, order=None):
        if permission == OrderPermissions.CREATE:
            cls.require_role(actor, [Role.CUSTOMER])
            return True
            
        elif permission == OrderPermissions.VIEW_OWN:
            cls.require_role(actor, [Role.CUSTOMER])
            if order and str(order.customer_id) != str(actor.id):
                raise PermissionDenied("Cannot view another customer's order.")
            return True
            
        elif permission == OrderPermissions.VIEW:
            cls.require_role(actor, [Role.STAFF, Role.MANAGER, Role.SUPERADMIN])
            return True
            
        elif permission == OrderPermissions.CANCEL:
            cls.require_role(actor, [Role.CUSTOMER, Role.MANAGER, Role.SUPERADMIN])
            if order:
                if actor.role == Role.CUSTOMER and str(order.customer_id) != str(actor.id):
                    raise PermissionDenied("Cannot cancel another customer's order.")
            return True
            
        elif permission == OrderPermissions.FULFILL:
            cls.require_role(actor, [Role.STAFF, Role.MANAGER, Role.SUPERADMIN])
            return True
            
        elif permission == OrderPermissions.OVERRIDE_FULFILLMENT:
            cls.require_role(actor, [Role.MANAGER, Role.SUPERADMIN])
            return True
            
        raise PermissionDenied(f"Unknown permission or access denied: {permission}")
