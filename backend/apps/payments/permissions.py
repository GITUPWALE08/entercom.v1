from apps.common.permissions import BasePermissionChecker, Role, Actor
from django.core.exceptions import PermissionDenied
from apps.payments.models import PaymentStatus

class PaymentPermissions:
    INITIALIZE = 'payment.initialize'
    VIEW_OWN = 'payment.view_own'
    VIEW = 'payment.view'
    CANCEL = 'payment.cancel'
    RECONCILE = 'payment.reconcile'

class WebhookPermissions:
    PROCESS = 'webhook.process'
    VIEW = 'webhook.view'

class PaymentPermissionChecker(BasePermissionChecker):
    @classmethod
    def check(cls, actor: Actor, permission: str, payment=None):
        if permission == PaymentPermissions.INITIALIZE:
            cls.require_role(actor, [Role.CUSTOMER, Role.SUPERADMIN])
            if payment and actor.role == Role.CUSTOMER and str(payment.customer_id) != str(actor.id):
                raise PermissionDenied("Cannot initialize another customer's payment.")
            return True
            
        elif permission == PaymentPermissions.VIEW_OWN:
            cls.require_role(actor, [Role.CUSTOMER])
            if payment and str(payment.customer_id) != str(actor.id):
                raise PermissionDenied("Cannot view another customer's payment.")
            return True
            
        elif permission == PaymentPermissions.VIEW:
            cls.require_role(actor, [Role.STAFF, Role.MANAGER, Role.SUPERADMIN])
            return True
            
        elif permission == PaymentPermissions.CANCEL:
            cls.require_role(actor, [Role.CUSTOMER, Role.MANAGER, Role.SUPERADMIN, Role.SYSTEM])
            if payment:
                if payment.status == PaymentStatus.PAID:
                    raise PermissionDenied("Cannot cancel a paid payment.")
                if actor.role == Role.CUSTOMER and str(payment.customer_id) != str(actor.id):
                    raise PermissionDenied("Cannot cancel another customer's payment.")
            return True
            
        elif permission == PaymentPermissions.RECONCILE:
            cls.require_role(actor, [Role.MANAGER, Role.SUPERADMIN])
            return True
            
        elif permission == WebhookPermissions.PROCESS:
            cls.require_role(actor, [Role.SYSTEM])
            return True
            
        elif permission == WebhookPermissions.VIEW:
            cls.require_role(actor, [Role.STAFF, Role.MANAGER, Role.SUPERADMIN])
            return True
            
        raise PermissionDenied(f"Unknown permission or access denied: {permission}")
