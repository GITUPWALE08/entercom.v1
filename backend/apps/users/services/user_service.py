from typing import Any, Dict
from django.contrib.auth import get_user_model
from apps.audit_logs.services.audit_service import log_creation, log_transition

User = get_user_model()

class UserService:
    @staticmethod
    def create_user(*, email: str, first_name: str, last_name: str, actor: Any) -> User:
        user = User.objects.create_user(email=email, first_name=first_name, last_name=last_name)
        log_creation(
            action="user.created",
            actor=actor,
            instance=user,
            reason="Admin created user"
        )
        return user

    @staticmethod
    def update_user(*, user: User, data: Dict[str, Any], actor: Any) -> User:
        old_user = User.objects.get(pk=user.pk)
        for attr, value in data.items():
            if hasattr(user, attr) and attr not in ['id', 'email']:
                setattr(user, attr, value)
        user.save()
        log_transition(
            action="user.updated",
            actor=actor,
            instance=user,
            old_instance=old_user,
            reason="Admin updated user"
        )
        return user

    @staticmethod
    def activate_user(*, user: User, actor: Any) -> User:
        old_user = User.objects.get(pk=user.pk)
        user.is_active = True
        user.save(update_fields=['is_active', 'updated_at'])
        log_transition(
            action="user.activated",
            actor=actor,
            instance=user,
            old_instance=old_user,
            reason="Admin activated user"
        )
        return user

    @staticmethod
    def deactivate_user(*, user: User, actor: Any) -> User:
        old_user = User.objects.get(pk=user.pk)
        user.is_active = False
        user.save(update_fields=['is_active', 'updated_at'])
        log_transition(
            action="user.deactivated",
            actor=actor,
            instance=user,
            old_instance=old_user,
            reason="Admin deactivated user"
        )
        return user
