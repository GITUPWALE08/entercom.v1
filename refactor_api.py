import os
import re

api_dir = r"C:\Users\HP\Desktop\workspace\entercom\v1\entercom\web\entercom\src\api"

for filename in os.listdir(api_dir):
    if filename.endswith(".ts") and filename not in ["axios.ts", "normalize.ts"]:
        filepath = os.path.join(api_dir, filename)
        with open(filepath, "r") as f:
            content = f.read()

        # Add import if not present
        if "normalizeData" not in content:
            content = "import { normalizeData } from './normalize';\n" + content

        # Replace return data.data;
        content = re.sub(r"return data\.data\s*;", "return normalizeData(data);", content)
        
        # Replace return data.data || data;
        content = re.sub(r"return data\.data \|\| data\s*;", "return normalizeData(data);", content)
        
        # Replace return data.results;
        content = re.sub(r"return data\.results\s*;", "return normalizeData(data);", content)
        
        # Replace return data; (but only if it's not already normalizeData(data))
        # Look for return data; taking care of whitespace
        content = re.sub(r"return data\s*;", "return normalizeData(data);", content)
        
        with open(filepath, "w") as f:
            f.write(content)

print("API files refactored.")
