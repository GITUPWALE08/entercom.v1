import pytest
from django.contrib.auth import get_user_model
from rest_framework.test import APIRequestFactory

from apps.audit_logs.models import AuditLogEntry
from core.drf_exception_handler import custom_exception_handler
from core.exceptions import PermissionDeniedError

User = get_user_model()


@pytest.mark.django_db
class TestDRFExceptionHandler:
    def test_unaudited_permission_denied_is_audited(self):
        user = User.objects.create(email="handler@example.com")
        factory = APIRequestFactory()
        request = factory.get("/")
        request.user = user
        exc = PermissionDeniedError("Denied")
        response = custom_exception_handler(exc, {"request": request, "view": None})
        assert response.status_code == 403
        assert AuditLogEntry.objects.filter(action="security.permission_denied").exists()
