import re

with open('apps/bookings/tests/test_services.py', 'r') as f:
    text = f.read()

# Add get_user_model and the fixture
text = text.replace('import uuid\n\nTECH_ID = uuid.uuid4()', 'import uuid\nfrom django.contrib.auth import get_user_model\n\nUser = get_user_model()\n\n@pytest.fixture\ndef tech_user():\n    return User.objects.create(email="tech@test.com")\n')

# Add tech_user to methods
text = text.replace('def test_start_booking_service(self, mock_event, mock_audit):', 'def test_start_booking_service(self, mock_event, mock_audit, tech_user):')
text = text.replace('def test_extend_duration_service(self, mock_conflict, mock_event, mock_audit):', 'def test_extend_duration_service(self, mock_conflict, mock_event, mock_audit, tech_user):')
text = text.replace('def test_sync_completion_service(self, mock_event, mock_audit):', 'def test_sync_completion_service(self, mock_event, mock_audit, tech_user):')
text = text.replace('def test_sync_cancellation_service(self, mock_event, mock_audit):', 'def test_sync_cancellation_service(self, mock_event, mock_audit, tech_user):')
text = text.replace('def test_has_conflict(self):', 'def test_has_conflict(self, tech_user):')
text = text.replace('def test_get_technician_availability(self, mock_get):', 'def test_get_technician_availability(self, mock_get, tech_user):')
text = text.replace('def test_update_working_hours(self, mock_event, mock_audit, mock_goc):', 'def test_update_working_hours(self, mock_event, mock_audit, mock_goc, tech_user):')
text = text.replace('def test_create_blackout_date(self, mock_event, mock_audit):', 'def test_create_blackout_date(self, mock_event, mock_audit, tech_user):')
text = text.replace('def test_delete_blackout_date(self, mock_event, mock_audit, mock_get):', 'def test_delete_blackout_date(self, mock_event, mock_audit, mock_get, tech_user):')

# Replace TECH_ID with tech_user.id
text = text.replace('TECH_ID', 'tech_user.id')

with open('apps/bookings/tests/test_services.py', 'w') as f:
    f.write(text)
