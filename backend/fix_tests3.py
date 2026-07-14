import re

with open('apps/bookings/tests/test_services.py', 'r') as f:
    text = f.read()

# Import Request model
text = text.replace('from apps.bookings.models.booking import Booking', 'from apps.bookings.models.booking import Booking\nfrom apps.requests.models.request import Request')

# Add request_obj fixture
request_fixture = """
@pytest.fixture
def request_obj(tech_user):
    return Request.objects.create(
        public_id="REQ-123",
        customer=tech_user,
        category="installation",
        priority="normal",
        status="draft",
        description="test"
    )
"""
text = text.replace('def tech_user():', request_fixture + '\ndef tech_user():')

# Add request_obj to test signatures that have tech_user
text = text.replace(', tech_user):', ', tech_user, request_obj):')

# Replace request_id=uuid.uuid4() with request_id=request_obj.id
text = text.replace('request_id=uuid.uuid4()', 'request_id=request_obj.id')

with open('apps/bookings/tests/test_services.py', 'w') as f:
    f.write(text)
