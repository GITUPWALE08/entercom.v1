import os
import re

src_dir = r"C:\Users\HP\Desktop\workspace\entercom\v1\entercom\web\entercom\src"

def process_file(filepath):
    with open(filepath, "r", encoding="utf-8") as f:
        content = f.read()

    original_content = content
    
    # We want to replace standard usages like `items.map` or `requests?.map` with `ensureArray(items).map`
    # We only apply this to common variables we know are array candidates.
    array_vars = [
        "users", "logs", "alerts", "activeRequests", "products", "categories", 
        "filteredProducts", "requests", "timeline", "escalatedRequests", 
        "openRequests", "inventoryAlerts", "pendingOrders", "pendingPayments", 
        "filteredRequests", "assignedRequests", "activeJobs", "pendingRequests",
        "verificationQueue", "quoteQueue", "sortedBookings", "orders", "payments",
        "technicians", "photos", "notifications", "items", "recentLogs", "recommendedProducts"
    ]
    
    for var in array_vars:
        # Match `var.map` or `var?.map` or `var.filter` or `var?.filter`
        # Also handle `(var || []).map`
        pattern1 = r"\b" + var + r"\?\.(map|filter|length|reduce|some|every|find)\b"
        content = re.sub(pattern1, r"ensureArray(" + var + r").\1", content)
        
        pattern2 = r"\b" + var + r"\.(map|filter|length|reduce|some|every|find)\b"
        content = re.sub(pattern2, r"ensureArray(" + var + r").\1", content)
        
        pattern3 = r"\(\s*" + var + r"\s*\|\|\s*\[\]\s*\)\.(map|filter|length|reduce|some|every|find)\b"
        content = re.sub(pattern3, r"ensureArray(" + var + r").\1", content)

    if content != original_content:
        # Add import if needed
        if "ensureArray" not in original_content:
            # We need to figure out the relative path to src/utils/arrays
            # For simplicity, we can use an absolute-like alias if configured, but Vite might not have it.
            # Let's compute relative path
            rel_path = os.path.relpath(os.path.join(src_dir, "utils", "arrays.ts"), os.path.dirname(filepath))
            # remove .ts extension and normalize slashes
            rel_path = rel_path[:-3].replace("\\", "/")
            if not rel_path.startswith("."):
                rel_path = "./" + rel_path
            import_stmt = f"import {{ ensureArray }} from '{rel_path}';\n"
            content = import_stmt + content
            
        with open(filepath, "w", encoding="utf-8") as f:
            f.write(content)

for root, dirs, files in os.walk(src_dir):
    for file in files:
        if file.endswith((".ts", ".tsx")) and file != "arrays.ts":
            process_file(os.path.join(root, file))

print("Defensive programming applied.")
