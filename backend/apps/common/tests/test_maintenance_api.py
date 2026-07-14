import pytest
from django.urls import reverse
from rest_framework import status
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from unittest.mock import patch

User = get_user_model()

pytestmark = pytest.mark.django_db

@pytest.fixture
def client():
    return APIClient()

@pytest.fixture
def superadmin_user():
    return User.objects.create_superuser(email="superadmin@example.com", first_name="Super", last_name="Admin", password="password")

@pytest.fixture
def standard_user():
    return User.objects.create_user(email="user@example.com", first_name="Test", last_name="User", password="password")

def test_maintenance_requires_auth(client):
    endpoints = [
        reverse("system_maintenance:maintenance-cleanup-roles"),
        reverse("system_maintenance:maintenance-archive-logs"),
        reverse("system_maintenance:maintenance-cleanup-payments"),
        reverse("system_maintenance:maintenance-execution-history")
    ]
    for url in endpoints:
        response = client.post(url) if 'history' not in url else client.get(url)
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

def test_maintenance_requires_superadmin(client, standard_user):
    client.force_authenticate(user=standard_user)
    endpoints = [
        reverse("system_maintenance:maintenance-cleanup-roles"),
        reverse("system_maintenance:maintenance-archive-logs"),
        reverse("system_maintenance:maintenance-cleanup-payments"),
        reverse("system_maintenance:maintenance-execution-history")
    ]
    for url in endpoints:
        response = client.post(url) if 'history' not in url else client.get(url)
        assert response.status_code == status.HTTP_403_FORBIDDEN

@patch('apps.common.views.maintenance.call_command')
def test_cleanup_roles(mock_call_command, client, superadmin_user):
    client.force_authenticate(user=superadmin_user)
    url = reverse("system_maintenance:maintenance-cleanup-roles")
    response = client.post(url)
    assert response.status_code == status.HTTP_200_OK
    assert response.data["status"] == "success"
    mock_call_command.assert_called_once()
    assert mock_call_command.call_args[0][0] == 'cleanup_expired_roles'

@patch('apps.common.views.maintenance.call_command')
def test_archive_logs(mock_call_command, client, superadmin_user):
    client.force_authenticate(user=superadmin_user)
    url = reverse("system_maintenance:maintenance-archive-logs")
    response = client.post(url)
    assert response.status_code == status.HTTP_200_OK
    assert response.data["status"] == "success"
    mock_call_command.assert_called_once()
    assert mock_call_command.call_args[0][0] == 'audit_retention'

@patch('apps.payments.services.payment_service.PaymentService.expire_payments')
def test_cleanup_payments(mock_expire_payments, client, superadmin_user):
    client.force_authenticate(user=superadmin_user)
    url = reverse("system_maintenance:maintenance-cleanup-payments")
    response = client.post(url)
    assert response.status_code == status.HTTP_200_OK
    assert response.data["status"] == "success"
    mock_expire_payments.assert_called_once()

def test_execution_history(client, superadmin_user):
    client.force_authenticate(user=superadmin_user)
    
    # Run a command to generate an audit log
    url_run = reverse("system_maintenance:maintenance-cleanup-roles")
    with patch('apps.common.views.maintenance.call_command'):
        client.post(url_run)
        
    url = reverse("system_maintenance:maintenance-execution-history")
    response = client.get(url)
    assert response.status_code == status.HTTP_200_OK
    assert "history" in response.data
    assert len(response.data["history"]) > 0
    assert response.data["history"][0]["action"] == "maintenance.cleanup_roles"
