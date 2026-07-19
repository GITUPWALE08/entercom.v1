import os
import django
import sys
import uuid

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from django.contrib.auth import get_user_model
from apps.requests.models import Request, LifecycleState
from apps.requests.services.quote_service import QuoteService
from apps.requests.domain.exceptions import InvalidTransitionError

User = get_user_model()

def test_phase_a():
    try:
        # Create dummy users
        customer, _ = User.objects.get_or_create(email="customer@test.com", defaults={"role": "customer", "first_name": "Test", "last_name": "Customer"})
        staff, _ = User.objects.get_or_create(email="staff@test.com", defaults={"role": "staff", "first_name": "Test", "last_name": "Staff"})
        
        # Create request in IN_PROGRESS (simulating a technician on-site for inspection)
        req = Request.objects.create(
            customer=customer,
            category="inspection",
            status=LifecycleState.IN_PROGRESS,
            public_id=f"REQ-{uuid.uuid4().hex[:6].upper()}"
        )
        print(f"Created request {req.public_id} in {req.status}")
        
        # Technician attempts to issue a quote
        quote_data = {"amount": 50000}
        print("Technician attempting to issue quote from IN_PROGRESS state...")
        
        try:
            QuoteService.create_quote(req.id, staff, quote_data)
            print("SUCCESS: Quote issued from IN_PROGRESS.")
        except InvalidTransitionError as e:
            print(f"FAILED (Blocker found): {e}")
            
    except Exception as e:
        print(f"Error setting up test: {e}")

if __name__ == '__main__':
    test_phase_a()
