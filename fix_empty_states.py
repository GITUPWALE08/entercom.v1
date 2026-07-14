import os
import re

files_info = [
    {
        'path': 'web/entercom/src/features/portal/customer/orders/OrderList.tsx',
        'icon': 'Package',
        'title': 'No orders yet',
        'desc': "You haven't placed any orders. Approved quotes will appear here.",
        'action_text': 'View Requests',
        'action_link': '/portal/customer/requests'
    },
    {
        'path': 'web/entercom/src/features/portal/customer/products/ProductList.tsx',
        'icon': 'ShoppingBag',
        'title': 'No products found',
        'desc': 'There are no products available in the catalog at this time.',
        'action_text': '',
        'action_link': ''
    },
    {
        'path': 'web/entercom/src/features/portal/customer/cart/Cart.tsx',
        'icon': 'ShoppingCart',
        'title': 'Your cart is empty',
        'desc': "Looks like you haven't added any products to your cart yet.",
        'action_text': 'Browse Shop',
        'action_link': '/portal/customer/shop'
    },
    {
        'path': 'web/entercom/src/features/portal/staff/requests/StaffRequestList.tsx',
        'icon': 'Inbox',
        'title': 'No pending requests',
        'desc': 'All service requests have been handled. Good job!',
        'action_text': '',
        'action_link': ''
    },
    {
        'path': 'web/entercom/src/features/portal/staff/orders/StaffOrderList.tsx',
        'icon': 'PackageCheck',
        'title': 'No active orders',
        'desc': 'There are no active orders requiring fulfillment.',
        'action_text': '',
        'action_link': ''
    },
    {
        'path': 'web/entercom/src/features/portal/staff/products/StaffProductList.tsx',
        'icon': 'Tags',
        'title': 'No products in catalog',
        'desc': 'Get started by creating your first product.',
        'action_text': 'Create Product',
        'action_link': '/portal/staff/products/new'
    }
]

for info in files_info:
    path = info['path']
    if not os.path.exists(path):
        continue
    with open(path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    match = re.search(r'(<div[^>]*text-center[^>]*>.*?</div>\s*)\)}', content, re.DOTALL)
    if not match:
        match = re.search(r'(<div[^>]*text-center[^>]*>.*?</svg>.*?</div>)', content, re.DOTALL)

    if match:
        old_div = match.group(1)
        action_prop = ''
        if info['action_text']:
            action_prop = f"""action={{
              <Link 
                to="{info['action_link']}" 
                className="inline-flex justify-center items-center px-6 py-2.5 bg-ess-purple text-white text-sm font-medium rounded-lg hover:bg-ess-darkPurple transition-colors shadow-sm"
              >
                {info['action_text']}
              </Link>
            }}"""
            
        empty_state = f"""<EmptyState
            icon={{<{info['icon']} className="w-10 h-10" />}}
            title="{info['title']}"
            description="{info['desc']}"
            {action_prop}
          />"""
          
        content = content.replace(old_div, empty_state)

        if 'EmptyState' not in content:
            if 'import { ErrorBoundary } from' in content:
                content = content.replace('import { ErrorBoundary } from', "import { EmptyState } from '../../../../shared/components/EmptyState';\nimport { ErrorBoundary } from")
            else:
                content = content.replace("import { Link }", "import { EmptyState } from '../../../../shared/components/EmptyState';\nimport { Link }")
        
        if 'lucide-react' not in content:
            if 'import { useQuery }' in content:
                content = content.replace('import { useQuery }', f"import {{ {info['icon']} }} from 'lucide-react';\nimport {{ useQuery }}")
            elif 'import { Link }' in content:
                content = content.replace('import { Link }', f"import {{ {info['icon']} }} from 'lucide-react';\nimport {{ Link }}")
        else:
            content = re.sub(r'import \{ ([^\}]+) \} from \'lucide-react\';', f"import {{ \\1, {info['icon']} }} from 'lucide-react';", content)

        with open(path, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"Replaced in {path}")
    else:
        print(f"Could not find match in {path}")
