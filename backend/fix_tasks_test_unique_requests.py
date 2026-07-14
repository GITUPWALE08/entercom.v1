import re

with open('apps/bookings/tests/test_tasks.py', 'r') as f:
    text = f.read()

setup_replacement = """
    def setup_method(self, method=None):
        self.tech_user = User.objects.create(email=f"tech_{uuid.uuid4()}@test.com")
        
    def create_request(self):
        return Request.objects.create(
            public_id=f"REQ-{uuid.uuid4()}",
            customer=self.tech_user,
            category="installation",
            priority="normal",
            status="draft",
            description="test",
            assigned_technician=self.tech_user
        )
"""

text = re.sub(r'    def setup_method\(self, method=None\):.*?assigned_technician=self.tech_user\n        \)', setup_replacement.strip(), text, flags=re.DOTALL)

text = text.replace('request_id=self.request_obj.id', 'request_id=self.create_request().id')

with open('apps/bookings/tests/test_tasks.py', 'w') as f:
    f.write(text)
