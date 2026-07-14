import os
import re

base = 'web/entercom/src/features/portal'
files_to_check = [
    'customer/Dashboard.tsx',
    'customer/requests/RequestList.tsx',
    'customer/requests/CreateRequest.tsx',
    'staff/Dashboard.tsx'
]

for f in files_to_check:
    path = os.path.join(base, f)
    print(f'\n--- {f} ---')
    with open(path, 'r', encoding='utf-8') as file:
        content = file.read()
    
    # Extract button classes
    buttons = re.findall(r'<button[^>]*className=[\'"`]([^\'"`]+)[\'"`]', content)
    links_as_buttons = re.findall(r'<Link[^>]*className=[\'"`]([^\'"`]*bg-[^\'"`]+)[\'"`]', content)
    print('Buttons:', set(buttons))
    print('Links (button-like):', set(links_as_buttons))
    
    # Extract card classes
    cards = re.findall(r'<div[^>]*className=[\'"`]([^\'"`]*bg-white[^\'"`]+rounded-[^\'"`]+)[\'"`]', content)
    print('Cards:', set(cards))
    
    # Extract typography classes
    h1s = re.findall(r'<h1[^>]*className=[\'"`]([^\'"`]+)[\'"`]', content)
    h2s = re.findall(r'<h2[^>]*className=[\'"`]([^\'"`]+)[\'"`]', content)
    print('H1s:', set(h1s))
    print('H2s:', set(h2s))
