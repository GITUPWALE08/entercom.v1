import os, re
base = 'web/entercom/src/features/portal'
for root, dirs, files in os.walk(base):
    for file in files:
        if file.endswith('.tsx'):
            path = os.path.join(root, file)
            with open(path, 'r', encoding='utf-8') as f:
                content = f.read()
            tables = re.findall(r'<table[^>]*className=[\'"`]([^\'"`]+)[\'"`]', content)
            if tables:
                print(f'{file}: {set(tables)}')
