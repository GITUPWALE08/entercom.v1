import pytest
from django.urls import reverse
from rest_framework.test import APIClient
from apps.notification.models import Notification, NotificationDelivery, NotificationPreference
from apps.notification.services import DispatchOrchestrator
from django.contrib.auth import get_user_model

User = get_user_model()

@pytest.mark.django_db
class TestNotificationPipeline:
    def test_dispatch_orchestrator_creates_notification_and_deliveries(self):
        user = User.objects.create(email='test@example.com', username='testuser')
        
        notification, deliveries = DispatchOrchestrator.dispatch_event(
            event_type="test.event",
            recipient_id=user.id,
            context={"foo": "bar"},
            resource_type="test",
            resource_id="123",
            category="alerts",
            title="Test Title",
            message="Test Message"
        )
        
        assert notification.id is not None
        assert notification.recipient == user
        assert notification.title == "Test Title"
        
        # Should create IN_APP and EMAIL by default
        channels = [d.channel for d in deliveries]
        assert NotificationDelivery.Channel.IN_APP in channels
        assert NotificationDelivery.Channel.EMAIL in channels

    def test_mark_all_read_endpoint(self):
        user = User.objects.create(email='test2@example.com', username='testuser2')
        Notification.objects.create(recipient=user, category="test", event_type="test.event", title="1", message="1")
        Notification.objects.create(recipient=user, category="test", event_type="test.event", title="2", message="2")
        
        client = APIClient()
        client.force_authenticate(user=user)
        response = client.post('/api/v1/notifications/mark-all-read/')
        
        assert response.status_code == 200
        assert Notification.objects.filter(recipient=user, status=Notification.Status.READ).count() == 2

    def test_archive_all_endpoint(self):
        user = User.objects.create(email='test3@example.com', username='testuser3')
        Notification.objects.create(recipient=user, category="test", event_type="test.event", title="1", message="1")
        
        client = APIClient()
        client.force_authenticate(user=user)
        response = client.post('/api/v1/notifications/archive-all/')
        
        assert response.status_code == 200
        assert Notification.objects.filter(recipient=user, status=Notification.Status.ARCHIVED).count() == 1
