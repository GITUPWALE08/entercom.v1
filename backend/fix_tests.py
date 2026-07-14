import re

with open('apps/bookings/tests/test_services.py', 'r') as f:
    text = f.read()

text = text.replace('import uuid', 'import uuid\n\nTECH_ID = uuid.uuid4()')
text = text.replace('id=1)', 'id=TECH_ID)')
text = text.replace('technician_id=1,', 'technician_id=TECH_ID,')
text = text.replace('has_conflict("1",', 'has_conflict(TECH_ID,')
text = text.replace('get_technician_availability("1",', 'get_technician_availability(TECH_ID,')
text = text.replace('update_working_hours("1",', 'update_working_hours(TECH_ID,')
text = text.replace('create_blackout_date("1",', 'create_blackout_date(TECH_ID,')
text = text.replace('technician_id == "1"', 'technician_id == TECH_ID')
text = text.replace('technician_id="1")', 'technician_id=TECH_ID)')

with open('apps/bookings/tests/test_services.py', 'w') as f:
    f.write(text)
