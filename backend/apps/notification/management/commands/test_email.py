from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from apps.notification.services import DispatchOrchestrator

User = get_user_model()

class Command(BaseCommand):
    help = "Send a test email through the NotificationService."

    def add_arguments(self, parser):
        parser.add_argument('email', type=str, help='Recipient email address')

    def handle(self, *args, **options):
        email = options['email']
        
        user = User.objects.filter(email=email).first()
        if not user:
            self.stdout.write(self.style.ERROR(f"No user found with email {email}. Created a dummy user for testing."))
            # For testing, we might need a user ID since Notification requires a recipient foreign key
            user, _ = User.objects.get_or_create(email=email, defaults={'username': email.split('@')[0]})
            
        self.stdout.write(self.style.NOTICE(f"Dispatching test 'welcome' event to {email}..."))

        notification, deliveries = DispatchOrchestrator.dispatch_event(
            event_type="welcome",
            recipient_id=user.id,
            context={"foo": "bar"},
            resource_type="system",
            resource_id="0",
            category="alerts",
            title="Test Email Integration",
            message="This is a test of the Notification Email Infrastructure."
        )

        self.stdout.write(self.style.SUCCESS(f"Successfully generated Notification ID: {notification.id}"))
        for delivery in deliveries:
            self.stdout.write(self.style.SUCCESS(f"  -> Queued Delivery ID: {delivery.id} [{delivery.channel}]"))
            
        self.stdout.write("Check Celery worker logs and Resend dashboard to verify delivery.")
