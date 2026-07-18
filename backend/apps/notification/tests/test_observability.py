from django.test import TestCase
from django.contrib.auth import get_user_model
from apps.notification.models import Notification, NotificationDelivery, DeliveryRetry
from apps.notification.observability import (
    FailureDashboardService,
    ResendService,
    NotificationSearchService,
    NotificationMetricsService
)
from apps.notification.services import FailureRecoveryService
import uuid

User = get_user_model()

class ObservabilityServicesTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(email="test@example.com", password="password")
        self.notification = Notification.objects.create(
            recipient=self.user,
            event_type="welcome",
            title="Welcome",
            message="Test message",
            category="updates"
        )
        self.delivery = NotificationDelivery.objects.create(
            notification=self.notification,
            channel=NotificationDelivery.Channel.EMAIL,
            status=NotificationDelivery.Status.PENDING,
            idempotency_key=str(uuid.uuid4())
        )

    def test_failure_recovery_creates_retry_record(self):
        # Trigger a transient failure
        FailureRecoveryService.classify_and_handle_failure(
            delivery_id=self.delivery.id,
            exception_msg="Connection timeout",
            is_transient=True,
            provider_name="Resend",
            error_code="TimeoutError"
        )
        
        self.delivery.refresh_from_db()
        self.assertEqual(self.delivery.status, NotificationDelivery.Status.FAILED)
        self.assertEqual(self.delivery.provider_name, "Resend")
        self.assertEqual(self.delivery.provider_error_code, "TimeoutError")
        
        # Verify DeliveryRetry was created
        retries = DeliveryRetry.objects.filter(delivery=self.delivery)
        self.assertEqual(retries.count(), 1)
        self.assertEqual(retries.first().reason, "Connection timeout")
        self.assertEqual(retries.first().outcome, "FAILED")

    def test_failure_recovery_dead_letter(self):
        # Trigger a permanent failure
        FailureRecoveryService.classify_and_handle_failure(
            delivery_id=self.delivery.id,
            exception_msg="Invalid email address",
            is_transient=False,
            provider_name="Resend",
            error_code="400"
        )
        
        self.delivery.refresh_from_db()
        self.assertEqual(self.delivery.status, NotificationDelivery.Status.DEAD_LETTERED)
        self.assertEqual(self.delivery.provider_error_message, "Invalid email address")

    def test_resend_workflow(self):
        admin = User.objects.create_superuser(email="admin@example.com", password="password")
        
        # Mark original as failed
        self.delivery.status = NotificationDelivery.Status.FAILED
        self.delivery.save()
        
        # Trigger resend
        new_delivery = ResendService.manual_resend(self.delivery.id, admin_user=admin)
        
        # Verify new delivery created
        self.assertNotEqual(self.delivery.id, new_delivery.id)
        self.assertEqual(new_delivery.notification, self.notification)
        self.assertEqual(new_delivery.status, NotificationDelivery.Status.PENDING)
        self.assertTrue("resend" in new_delivery.idempotency_key)

    def test_metrics_service(self):
        # Set up mixed statuses
        self.delivery.status = NotificationDelivery.Status.SENT
        self.delivery.save()
        
        NotificationDelivery.objects.create(
            notification=self.notification,
            channel=NotificationDelivery.Channel.EMAIL,
            status=NotificationDelivery.Status.FAILED,
            idempotency_key=str(uuid.uuid4())
        )
        
        NotificationDelivery.objects.create(
            notification=self.notification,
            channel=NotificationDelivery.Channel.EMAIL,
            status=NotificationDelivery.Status.DEAD_LETTERED,
            idempotency_key=str(uuid.uuid4())
        )
        
        metrics = NotificationMetricsService.get_metrics()
        self.assertEqual(metrics["total_sent"], 1)
        self.assertEqual(metrics["total_failed"], 2)
        self.assertEqual(metrics["dead_letter_count"], 1)
        
        # 1 sent out of 3 total -> ~33.33%
        self.assertAlmostEqual(metrics["success_rate"], 33.33, places=1)

    def test_dashboard_service(self):
        self.delivery.status = NotificationDelivery.Status.FAILED
        self.delivery.provider_name = "Resend"
        self.delivery.provider_error_code = "429"
        self.delivery.save()
        
        dashboard = FailureDashboardService.get_failed_deliveries()
        self.assertEqual(len(dashboard), 1)
        self.assertEqual(dashboard[0]['count'], 1)
        self.assertEqual(dashboard[0]['provider_name'], "Resend")

    def test_search_service(self):
        self.delivery.provider_name = "MockProvider"
        self.delivery.save()
        
        results = NotificationSearchService.search(
            provider_name="MockProvider",
            event_type="welcome"
        )
        
        self.assertEqual(results.count(), 1)
        self.assertEqual(results.first().id, self.delivery.id)
