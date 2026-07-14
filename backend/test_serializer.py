import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from apps.requests.models.request import Request, LifecycleState, RequestCategory, PriorityLevel
from apps.users.models import User
from apps.requests.api.serializers import RequestListSerializer

u = User.objects.create(email="test@test.com", role="STAFF")
req = Request.objects.create(customer=u, status="submitted", category="maintenance", priority="normal")

class DummyRequest:
    user = u

serializer = RequestListSerializer(context={"request": DummyRequest()})
next_states = serializer.get_next_states(req)
print("NEXT STATES:", next_states)
