import pytest
from django.urls import reverse
from rest_framework import status
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient

User = get_user_model()

pytestmark = pytest.mark.django_db

@pytest.fixture
def client():
    return APIClient()

@pytest.fixture
def admin_user():
    return User.objects.create_superuser(email="admin@example.com", first_name="Admin", last_name="User", password="password")

@pytest.fixture
def standard_user():
    return User.objects.create_user(email="user@example.com", first_name="Test", last_name="User", password="password")

def test_create_user(client, admin_user):
    client.force_authenticate(user=admin_user)
    url = reverse("users:user-list")
    data = {
        "email": "newuser@example.com",
        "first_name": "New",
        "last_name": "User"
    }
    response = client.post(url, data)
    assert response.status_code == status.HTTP_201_CREATED
    assert User.objects.filter(email="newuser@example.com").exists()

def test_update_user(client, admin_user, standard_user):
    client.force_authenticate(user=admin_user)
    url = reverse("users:user-detail", args=[standard_user.id])
    data = {
        "first_name": "Updated"
    }
    response = client.patch(url, data)
    assert response.status_code == status.HTTP_200_OK
    standard_user.refresh_from_db()
    assert standard_user.first_name == "Updated"

def test_deactivate_user(client, admin_user, standard_user):
    client.force_authenticate(user=admin_user)
    url = reverse("users:user-deactivate", args=[standard_user.id])
    response = client.post(url)
    assert response.status_code == status.HTTP_200_OK
    standard_user.refresh_from_db()
    assert standard_user.is_active is False

def test_activate_user(client, admin_user, standard_user):
    standard_user.is_active = False
    standard_user.save()
    client.force_authenticate(user=admin_user)
    url = reverse("users:user-activate", args=[standard_user.id])
    response = client.post(url)
    assert response.status_code == status.HTTP_200_OK
    standard_user.refresh_from_db()
    assert standard_user.is_active is True

def test_trigger_password_reset(client, admin_user, standard_user):
    client.force_authenticate(user=admin_user)
    url = reverse("users:user-trigger-password-reset", args=[standard_user.id])
    response = client.post(url)
    assert response.status_code == status.HTTP_200_OK
    # In auth_service, requesting a password reset will return None and log an action.
