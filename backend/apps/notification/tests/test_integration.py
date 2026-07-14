import pytest
from unittest.mock import patch
from django.contrib.auth import get_user_model
from apps.notification.models import Notification, NotificationDelivery, NotificationPreference
from apps.notification.services import DispatchOrchestrator
from apps.notification.tasks import job_sweep_transient_failures

User = get_user_model()

@pytest.fixture
def user(db):
    return User.objects.create_user(
        email="test@example.com", 
        password="password",
        first_name="Test",
        last_name="User"
    )

@pytest.mark.django_db
class TestNotificationOrchestration:
    def test_dispatch_orchestrator(self, user):
        """Notification Orchestration Test"""
        NotificationPreference.objects.create(
            user=user, category="alerts", channel=NotificationDelivery.Channel.PUSH, is_enabled=False
        )
        
        notification, deliveries = DispatchOrchestrator.dispatch_event(
            event_type="test_event",
            recipient_id=user.id,
            context={"data": "123"},
            resource_type="request",
            resource_id="req_1",
            category="alerts",
            title="Test Alert",
            message="This is a test."
        )
        
        assert notification.id is not None
        assert notification.recipient_id == user.id
        
        # Default global is True, but PUSH is explicitly False
        channels = [d.channel for d in deliveries]
        assert NotificationDelivery.Channel.IN_APP in channels
        assert NotificationDelivery.Channel.EMAIL in channels
        assert NotificationDelivery.Channel.PUSH not in channels

@pytest.mark.django_db
class TestNotificationIdempotency:
    def test_idempotency_constraint(self, user):
        """Idempotency Test"""
        from django.db.utils import IntegrityError
        
        notification = Notification.objects.create(
            recipient=user, category="test", event_type="test", title="t", message="m"
        )
        
        # Create first delivery
        NotificationDelivery.objects.create(
            notification=notification,
            channel=NotificationDelivery.Channel.EMAIL,
            idempotency_key="key_1"
        )
        
        # Creating second with same key should raise IntegrityError
        with pytest.raises(IntegrityError):
            NotificationDelivery.objects.create(
                notification=notification,
                channel=NotificationDelivery.Channel.PUSH,
                idempotency_key="key_1"
            )

@pytest.mark.django_db
class TestRetryMechanism:
    @patch('apps.notification.tasks.task_dispatch_email.delay')
    def test_job_sweep_transient_failures(self, mock_delay, user):
        """Retry Mechanism Test"""
        notification = Notification.objects.create(
            recipient=user, category="test", event_type="test", title="t", message="m"
        )
        delivery = NotificationDelivery.objects.create(
            notification=notification,
            channel=NotificationDelivery.Channel.EMAIL,
            status=NotificationDelivery.Status.FAILED,
            retry_count=5,
            idempotency_key="key_retry"
        )
        
        job_sweep_transient_failures()
        
        delivery.refresh_from_db()
        assert delivery.status == NotificationDelivery.Status.PENDING
        assert delivery.retry_count == 6
        mock_delay.assert_called_once_with(delivery.id)

@pytest.mark.django_db
class TestEventRouting:
    @patch('apps.websocket.publisher.EventPublisher.publish_to_channel')
    def test_signal_publishes_event(self, mock_publish, user):
        """Event Routing Test via Signals"""
        notification = Notification.objects.create(
            recipient=user, category="test", event_type="test", title="t", message="m"
        )
        
        mock_publish.assert_called_once()
        args, kwargs = mock_publish.call_args
        channel_name, payload = args
        
        assert channel_name == f"user.{user.id}.notifications"
        assert payload['id'] == str(notification.id)
        assert payload['title'] == "t"
