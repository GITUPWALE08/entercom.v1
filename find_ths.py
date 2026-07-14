import os, re
base = 'web/entercom/src/features/portal'
for root, dirs, files in os.walk(base):
    for file in files:
        if file.endswith('.tsx'):
            path = os.path.join(root, file)
            with open(path, 'r', encoding='utf-8') as f:
                content = f.read()
            ths = re.findall(r'<th[^>]*className=[\'"`]([^\'"`]+)[\'"`]', content)
            if ths:
                print(f'{file}: {set(ths)}')
