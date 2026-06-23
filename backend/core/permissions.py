from django.core.exceptions import PermissionDenied

# Mapped strictly from: docs/product-order-payment/implementation/product/product-permission-mapping.md
# Mapped strictly from: docs/product-order-payment/implementation/order/order-permission-mapping.md
# Mapped strictly from: docs/product-order-payment/implementation/payment/payment-permission-mapping.md

ROLE_PERMISSIONS = {
    # Product Domain
    "product.view": ["customer", "staff", "manager", "superadmin"],
    "product.create": ["staff", "manager", "superadmin"],
    "product.update": ["staff", "manager", "superadmin"],
    "product.archive": ["manager", "superadmin"],
    "category.view": ["customer", "staff", "manager", "superadmin"],
    "category.create": ["staff", "manager", "superadmin"],
    "category.update": ["staff", "manager", "superadmin"],
    "category.archive": ["manager", "superadmin"],
    "inventory.view": ["staff", "manager", "superadmin"],
    "inventory.adjust": ["manager", "superadmin"],
    "inventory.manage": ["manager", "superadmin"],
    
    # Order Domain
    "order.view": ["customer", "staff", "manager", "superadmin"],
    "order.create": ["customer", "staff", "manager", "superadmin"],
    "order.update": ["staff", "manager", "superadmin"],
    "order.cancel": ["customer", "staff", "manager", "superadmin"],
    
    # Payment Domain
    "payment.view": ["customer", "staff", "manager", "superadmin"],
    "payment.initialize": ["customer", "staff", "manager", "superadmin"],
}

def require_permission(actor, permission: str):
    """
    Validates if the executing actor holds the specified permission mapping.
    Raises PermissionDenied if the actor lacks authorization.
    """
    if hasattr(actor, 'is_authenticated') and not actor.is_authenticated:
        raise PermissionDenied("User is not authenticated.")

    is_superuser = getattr(actor, 'is_superuser', False)
    actor_role = getattr(actor, 'role', '')
    
    if hasattr(actor_role, 'value'):
        actor_role = actor_role.value
        
    if actor_role and str(actor_role).lower() == 'superadmin':
        is_superuser = True

    if is_superuser:
        return True
        
    allowed_roles = ROLE_PERMISSIONS.get(permission, [])
    
    actor_role_lower = str(actor_role).lower() if actor_role else ''
    if not actor_role_lower or actor_role_lower not in allowed_roles:
        raise PermissionDenied(f"Role '{actor_role}' does not have permission '{permission}'.")
    
    return True
