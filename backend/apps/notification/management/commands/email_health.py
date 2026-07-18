from django.core.management.base import BaseCommand
from apps.notification.providers.health import ProviderHealthMonitor
import json
import sys

class Command(BaseCommand):
    help = "Verify the health and configuration of the currently active EmailProvider."

    def handle(self, *args, **options):
        self.stdout.write("Checking email provider health...")
        health_status = ProviderHealthMonitor.check_system_health()
        
        output = json.dumps(health_status, indent=2)
        
        if health_status.get("status") == "HEALTHY":
            self.stdout.write(self.style.SUCCESS(f"Provider Health Check Passed:\n{output}"))
        else:
            self.stdout.write(self.style.ERROR(f"Provider Health Check Failed:\n{output}"))
            sys.exit(1)
