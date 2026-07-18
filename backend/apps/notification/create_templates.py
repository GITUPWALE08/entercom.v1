import os

base_dir = r"C:\Users\HP\Desktop\workspace\entercom\v1\entercom\backend\apps\notification\templates\email"
os.makedirs(base_dir, exist_ok=True)

templates = [
    "welcome", "booking_created", "booking_reminder", "assignment_received",
    "quote_ready", "quote_approved", "job_completed", "payment_receipt", "password_reset"
]

for t in templates:
    # HTML
    html_content = f"""<!DOCTYPE html>
<html>
<head><title>{t.replace('_', ' ').title()}</title></head>
<body>
    <h2>Hello {{{{ user.first_name|default:"there" }}}},</h2>
    <p>{{{{ notification.message }}}}</p>
    <p>Thank you,<br>The Entercom Team</p>
</body>
</html>"""
    with open(os.path.join(base_dir, f"{t}.html"), "w") as f:
        f.write(html_content)
        
    # TXT
    txt_content = f"""Hello {{{{ user.first_name|default:"there" }}}},

{{{{ notification.message }}}}

Thank you,
The Entercom Team"""
    with open(os.path.join(base_dir, f"{t}.txt"), "w") as f:
        f.write(txt_content)

print("Templates created.")
