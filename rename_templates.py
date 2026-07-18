import os
import shutil

template_dir = r"C:\Users\HP\Desktop\workspace\entercom\v1\entercom\backend\apps\notification\templates\email"

renames = {
    "request_assigned": "technician_assigned",
    "payment_received": "payment_receipt",
    "booking_created": "booking_confirmed"
}

for old, new in renames.items():
    old_html = os.path.join(template_dir, f"{old}.html")
    new_html = os.path.join(template_dir, f"{new}.html")
    old_txt = os.path.join(template_dir, f"{old}.txt")
    new_txt = os.path.join(template_dir, f"{new}.txt")
    
    if os.path.exists(old_html):
        shutil.move(old_html, new_html)
    if os.path.exists(old_txt):
        shutil.move(old_txt, new_txt)

# Create welcome if it doesn't exist
welcome_html = os.path.join(template_dir, "welcome.html")
if not os.path.exists(welcome_html):
    with open(welcome_html, "w") as f:
        f.write('{% extends "email/base.html" %}\n{% block content %}\n<h2>Welcome to Entercom</h2>\n<p>Hello,</p>\n<p>We are excited to have you on board.</p>\n{% endblock %}\n')
welcome_txt = os.path.join(template_dir, "welcome.txt")
if not os.path.exists(welcome_txt):
    with open(welcome_txt, "w") as f:
        f.write('Welcome to Entercom\n\nHello,\n\nWe are excited to have you on board.\n')

print("Renaming and creation complete.")
