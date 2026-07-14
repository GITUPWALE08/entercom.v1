from typing import Any, Dict
from django.contrib.auth import get_user_model
from apps.audit_logs.services.audit_service import log_action

User = get_user_model()

class UserService:
    @staticmethod
    def create_user(*, email: str, first_name: str, last_name: str, actor: Any) -> User:
        user = User.objects.create_user(email=email, first_name=first_name, last_name=last_name)
        log_action(
            action="user.created",
            actor=actor,
            resource_type="user",
            resource_id=str(user.id),
            reason="Admin created user"
        )
        return user

    @staticmethod
    def update_user(*, user: User, data: Dict[str, Any], actor: Any) -> User:
        for attr, value in data.items():
            if hasattr(user, attr) and attr not in ['id', 'email']:
                setattr(user, attr, value)
        user.save()
        log_action(
            action="user.updated",
            actor=actor,
            resource_type="user",
            resource_id=str(user.id),
            reason="Admin updated user"
        )
        return user

    @staticmethod
    def activate_user(*, user: User, actor: Any) -> User:
        user.is_active = True
        user.save(update_fields=['is_active', 'updated_at'])
        log_action(
            action="user.activated",
            actor=actor,
            resource_type="user",
            resource_id=str(user.id),
            reason="Admin activated user"
        )
        return user

    @staticmethod
    def deactivate_user(*, user: User, actor: Any) -> User:
        user.is_active = False
        user.save(update_fields=['is_active', 'updated_at'])
        log_action(
            action="user.deactivated",
            actor=actor,
            resource_type="user",
            resource_id=str(user.id),
            reason="Admin deactivated user"
        )
        return user
