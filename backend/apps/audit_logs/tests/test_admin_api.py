import pytest
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient

from apps.audit_logs.services.audit_policy import CRITICAL_PREFIXES

pytestmark = pytest.mark.django_db

@pytest.fixture
def api_client():
    return APIClient()

def test_audit_policy_endpoint(api_client, admin_user):
    api_client.force_authenticate(user=admin_user)
    url = reverse("audit_logs:policy")
    response = api_client.get(url)
    assert response.status_code == status.HTTP_200_OK
    assert "critical_prefixes" in response.data
    assert response.data["critical_prefixes"] == CRITICAL_PREFIXES

def test_audit_monitoring_endpoint(api_client, admin_user):
    api_client.force_authenticate(user=admin_user)
    url = reverse("audit_logs:monitoring")
    response = api_client.get(url)
    assert response.status_code == status.HTTP_200_OK
    assert response.data["status"] == "healthy"
    assert "adapters" in response.data

def test_audit_retention_endpoint(api_client, admin_user):
    api_client.force_authenticate(user=admin_user)
    url = reverse("audit_logs:retention_run")
    response = api_client.post(url, {"dry_run": True})
    assert response.status_code == status.HTTP_200_OK
    assert "security_archived" in response.data
    assert "general_purged" in response.data
    assert response.data["dry_run"] is True

def test_endpoints_require_auth(api_client):
    endpoints = [
        reverse("audit_logs:policy"),
        reverse("audit_logs:monitoring"),
        reverse("audit_logs:retention_run"),
    ]
    for url in endpoints:
        response = api_client.get(url) if "run" not in url else api_client.post(url)
        assert response.status_code == status.HTTP_401_UNAUTHORIZED
