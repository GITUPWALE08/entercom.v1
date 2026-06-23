from .models import AuditRecord
from .constants import AuditAction, ActorType

def resolve_actor_type(actor) -> str:
    if actor is None:
        return "System"
    role = getattr(actor, 'role', '')
    if hasattr(role, 'value'):
        role = role.value
    role = str(role).lower() if role else ''
    if role == 'customer': return "Customer"
    if role == 'staff': return "Staff"
    if role == 'manager': return "Manager"
    if role == 'superadmin': return "Superadmin"
    if getattr(actor, 'is_superuser', False): return "Superadmin"
    if getattr(actor, 'is_staff', False): return "Staff"
    return "Customer"

class AuditService:
    @staticmethod
    def log(action, actor_id: str, actor_type, correlation_id: str, metadata: dict) -> AuditRecord:
        """
        Logs an immutable audit record.
        """
        action_val = action.value if hasattr(action, 'value') else action
        actor_type_val = actor_type.value if hasattr(actor_type, 'value') else actor_type

        return AuditRecord.objects.create(
            action=action_val,
            actor_id=str(actor_id) if actor_id else None,
            actor_type=actor_type_val,
            correlation_id=str(correlation_id) if correlation_id else None,
            metadata=metadata
        )
