import os

events = [
    "request_created", "request_submitted", "request_assigned", "request_cancelled", 
    "request_completed", "request_escalated",
    "quote_created", "quote_ready", "quote_revision_requested", "quote_approved", 
    "quote_rejected", "quote_expired",
    "assignment_received", "assignment_accepted", "assignment_declined", "assignment_reassigned",
    "booking_created", "booking_confirmed", "booking_reminder", "technician_en_route", 
    "technician_arrived", "job_started", "job_completed",
    "payment_received", "payment_failed", "payment_expired", "invoice_generated", "refund_issued",
    "verification_required", "verification_approved", "verification_failed",
    "sla_warning", "sla_breached",
    "manager_escalated", "emergency_queue_entered"
]

template_dir = r"C:\Users\HP\Desktop\workspace\entercom\v1\entercom\backend\apps\notification\templates\email"
os.makedirs(template_dir, exist_ok=True)

for event in events:
    html_path = os.path.join(template_dir, f"{event}.html")
    txt_path = os.path.join(template_dir, f"{event}.txt")
    
    if not os.path.exists(html_path):
        with open(html_path, "w") as f:
            f.write(f'{{% extends "email/base.html" %}}\n{{% block content %}}\n<h2>{event.replace("_", " ").title()}</h2>\n<p>Hello,</p>\n<p>This is a notification for {event.replace("_", " ")}.</p>\n{{% endblock %}}\n')
            
    if not os.path.exists(txt_path):
        with open(txt_path, "w") as f:
            f.write(f'{event.replace("_", " ").title()}\n\nHello,\n\nThis is a notification for {event.replace("_", " ")}.\n')

print("Templates created successfully.")
