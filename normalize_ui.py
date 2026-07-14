import os
import re

base_dir = 'web/entercom/src/features/portal'

# Define standard classes
# H1
std_h1 = r'text-3xl font-bold text-gray-900 tracking-tight'
# Cards
std_card_outer = r'bg-white rounded-2xl shadow-sm border border-gray-100'

def replace_in_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    new_content = content
    
    # 1. Normalize H1s
    new_content = re.sub(
        r'<h1[^>]*className=[\'"`](.*?)[\'"`]',
        r'<h1 className="text-3xl font-bold text-gray-900 tracking-tight"',
        new_content
    )
    
    # 2. Normalize blue buttons to ess-purple
    new_content = new_content.replace('bg-blue-600', 'bg-ess-purple')
    new_content = new_content.replace('hover:bg-blue-700', 'hover:bg-ess-darkPurple')
    new_content = new_content.replace('text-blue-600', 'text-ess-purple')
    new_content = new_content.replace('hover:text-blue-700', 'hover:text-ess-darkPurple')
    new_content = new_content.replace('border-blue-600', 'border-ess-purple')
    new_content = new_content.replace('ring-blue-500', 'ring-ess-purple')
    
    # 3. Normalize rounded borders on inputs/selects/textareas to rounded-xl
    new_content = re.sub(
        r'(<input|<select|<textarea)[^>]*className=[\'"`]([^\'"`]*rounded-(?:md|lg|sm)[^\'"`]*)[\'"`]',
        lambda m: m.group(0).replace(re.search(r'rounded-(?:md|lg|sm)', m.group(2)).group(0), 'rounded-xl'),
        new_content
    )

    # 4. Standardize empty state button (which was rounded-lg) -> rounded-xl
    new_content = new_content.replace('rounded-lg hover:bg-ess-darkPurple', 'rounded-xl hover:bg-ess-darkPurple')
    
    # 5. Cards: we have some `rounded-xl` cards, let's make them `rounded-2xl` if they have `bg-white` and `shadow-sm`
    new_content = re.sub(
        r'className=[\'"`]([^\'"`]*bg-white[^\'"`]*rounded-xl[^\'"`]*shadow-sm[^\'"`]*)[\'"`]',
        lambda m: 'className="' + m.group(1).replace('rounded-xl', 'rounded-2xl') + '"',
        new_content
    )

    if content != new_content:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(new_content)
        print(f"Updated {filepath}")

for root, dirs, files in os.walk(base_dir):
    for file in files:
        if file.endswith('.tsx'):
            replace_in_file(os.path.join(root, file))
