import os, re
d = 'apps/requests/tests'
for r, _, fs in os.walk(d):
    for f in fs:
        if f.endswith('.py'):
            p = os.path.join(r, f)
            content = open(p).read()
            new_content = re.sub(r'role=\"([a-z_]+)\"', lambda m: 'role=\"' + m.group(1).upper() + '\"', content)
            if new_content != content:
                open(p, 'w').write(new_content)
                print(f'Updated {p}')
