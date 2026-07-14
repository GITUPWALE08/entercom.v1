import os
import glob

files = glob.glob(r"C:\Users\HP\Desktop\workspace\entercom\v1\entercom\web\entercom\src\shared\components\ui\*.tsx")
for f in files:
    with open(f, 'r') as file:
        content = file.read()
    
    new_content = content.replace("import React from 'react';\n", "").replace("import React, {", "import {")
    
    with open(f, 'w') as file:
        file.write(new_content)
        
print("Removed unused React imports")
