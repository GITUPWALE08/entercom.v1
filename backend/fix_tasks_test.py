import re

with open('apps/bookings/tests/test_tasks.py', 'r') as f:
    text = f.read()

# Add get_user_model and Request
text = text.replace('import uuid', 'import uuid\nfrom django.contrib.auth import get_user_model\nfrom apps.requests.models.request import Request\nUser = get_user_model()')

# Add tech_user and request_obj fixtures
# Wait, test_tasks.py uses setUp, not fixtures directly, wait, actually pytest fixtures are better.
# Let's just create them inside setUp or at the module level.
# Actually, since it uses django_db(transaction=True), we can use setUp method.

setup_method = """
    def setUp(self):
        self.tech_user = User.objects.create(email="tech_tasks@test.com")
        self.request_obj = Request.objects.create(
            public_id="REQ-TASKS-123",
            customer=self.tech_user,
            category="installation",
            priority="normal",
            status="draft",
            description="test",
            assigned_technician=self.tech_user
        )
"""

text = text.replace('    def setUp(self):\n        pass', setup_method)

# Replace request_id=uuid.uuid4() with request_id=self.request_obj.id
text = text.replace('request_id=uuid.uuid4()', 'request_id=self.request_obj.id')

# Replace technician_id=1 with technician_id=self.tech_user.id
text = text.replace('technician_id=1,', 'technician_id=self.tech_user.id,')

with open('apps/bookings/tests/test_tasks.py', 'w') as f:
    f.write(text)
