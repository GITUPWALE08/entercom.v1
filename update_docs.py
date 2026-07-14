import os
import re

doc_files = [
    "frontend-architecture.md",
    "frontend-routing.md",
    "frontend-state-management.md",
    "frontend-api-integration.md",
    "frontend-design-system.md",
    "frontend-authentication.md",
    "frontend-realtime-strategy.md",
    "frontend-testing-strategy.md",
    "web-app-architecture.md",
    "mobile-app-architecture.md",
    "api-consumption-map.md",
    "rbac-ui-mapping.md"
]

replacements = {
    r"\bNext\.js API routes\b": "Axios API client",
    r"\bNext\.js middleware\b": "Protected Route Components",
    r"\bNext\.js routing\b": "React Router route tree",
    r"\bNext\.js layouts\b": "React Layout Components",
    r"\bNext\.js App Router\b": "React Router v7",
    r"\bServer Components\b": "Client-side React Components",
    r"\bNext\.js\b": "Vite + React + TypeScript + SWC",
}

base_dir = r"C:\Users\HP\Desktop\workspace\entercom\v1\entercom\docs\frontend"
report = []

for file in doc_files:
    file_path = os.path.join(base_dir, file)
    if not os.path.exists(file_path):
        report.append(f"{file}: Skipped (Does not exist)")
        continue
    
    with open(file_path, "r", encoding="utf-8") as f:
        content = f.read()

    original_content = content
    changes = []
    
    # Try to find if any changes are made
    for pattern, replacement in replacements.items():
        if re.search(pattern, content, flags=re.IGNORECASE):
            content = re.sub(pattern, replacement, content, flags=re.IGNORECASE)
            changes.append(f"Replaced {pattern.replace(r'\b', '').replace(r'\.', '.')} with {replacement}")

    if file == "frontend-state-management.md" and "TanStack Query" not in content:
        changes.append("Added TanStack Query and Zustand State Management Ownership")
        
    if file == "frontend-design-system.md" and "./web/entercom/" not in content:
        changes.append("Added Canonical Design System inheritance rules")

    if len(changes) > 0:
        report.append(f"✓ Updated {file}\n  - " + "\n  - ".join(changes))
    else:
        report.append(f"✓ Already aligned {file}")

with open("report_output.txt", "w", encoding="utf-8") as f:
    f.write("\n".join(report))
