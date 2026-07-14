import os
import re

def replace_in_file(filepath, pattern, replacement):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    new_content = re.sub(pattern, replacement, content)
    if content != new_content:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(new_content)
        print(f"Updated {filepath}")

base = "web/entercom/src"

files_with_unused_react = [
    "features/portal/customer/cart/Cart.tsx",
    "features/portal/customer/checkout/Checkout.tsx",
    "features/portal/customer/Dashboard.tsx",
    "features/portal/customer/orders/OrderDetail.tsx",
    "features/portal/customer/orders/OrderList.tsx",
    "features/portal/customer/payments/PaymentList.tsx",
    "features/portal/customer/products/ProductDetail.tsx",
    "features/portal/customer/products/ProductList.tsx",
    "features/portal/customer/profile/Profile.tsx",
    "features/portal/customer/quotes/QuoteDetail.tsx",
    "features/portal/customer/requests/CreateRequest.tsx",
    "features/portal/customer/requests/RequestDetail.tsx",
    "features/portal/customer/requests/RequestList.tsx",
    "features/portal/staff/Dashboard.tsx",
    "features/portal/staff/orders/StaffOrderDetail.tsx",
    "features/portal/staff/orders/StaffOrderList.tsx",
    "layouts/PortalLayout.tsx"
]

def fix_react_import(m):
    g1 = m.group(1)
    if g1:
        g1 = g1.strip(", ")
        return f"import {g1} from 'react';\n"
    return ""

for file in files_with_unused_react:
    replace_in_file(f"{base}/{file}", r"import React(,\s*\{[^}]+\})? from 'react';\n", fix_react_import)
    replace_in_file(f"{base}/{file}", r"import React from 'react';\n", "")
    replace_in_file(f"{base}/{file}", r"import \{\s*\} from 'react';\n", "")

# 4. Fix cartStore and Cart.tsx subtotal
replace_in_file(f"{base}/store/cartStore.ts", r"import \{ ProductItem \} from '\.\./api/products';", r"import type { ProductItem } from '../api/products';")

replace_in_file(f"{base}/features/portal/customer/cart/Cart.tsx", r"const \{ items, updateQuantity, removeItem, subtotal \} = useCartStore\(\);", "const { items, updateQuantity, removeItem } = useCartStore();\n  const subtotal = items.reduce((acc, item) => acc + parseFloat(item.product.unit_price || item.product.price || '0') * item.quantity, 0);")
replace_in_file(f"{base}/features/portal/customer/checkout/Checkout.tsx", r"const \{ items, clearCart, subtotal \} = useCartStore\(\);", "const { items, clearCart } = useCartStore();\n  const subtotal = items.reduce((acc, item) => acc + parseFloat(item.product.unit_price || item.product.price || '0') * item.quantity, 0);")


# 5. Fix price to unit_price fallback in various files:
for file in ["features/portal/customer/cart/Cart.tsx", "features/portal/customer/checkout/Checkout.tsx", "features/portal/customer/Dashboard.tsx", "features/portal/customer/products/ProductDetail.tsx", "features/portal/customer/products/ProductList.tsx"]:
    replace_in_file(f"{base}/{file}", r"item\.product\.price", "(item.product.unit_price || item.product.price)")
    replace_in_file(f"{base}/{file}", r"product\.price", "(product.unit_price || product.price)")

# 6. Fix type imports (verbatimModuleSyntax)
replace_in_file(f"{base}/features/portal/customer/orders/OrderList.tsx", r"import \{ ordersApi, OrderItem \} from '\.\./\.\./\.\./\.\./api/orders';", "import { ordersApi } from '../../../../api/orders';\nimport type { OrderItem } from '../../../../api/orders';")
replace_in_file(f"{base}/features/portal/customer/payments/PaymentList.tsx", r"import \{ paymentsApi, PaymentItem \} from '\.\./\.\./\.\./\.\./api/payments';", "import { paymentsApi } from '../../../../api/payments';\nimport type { PaymentItem } from '../../../../api/payments';")
replace_in_file(f"{base}/features/portal/customer/products/ProductList.tsx", r"import \{ productsApi, ProductItem \} from '\.\./\.\./\.\./\.\./api/products';", "import { productsApi } from '../../../../api/products';\nimport type { ProductItem } from '../../../../api/products';")
replace_in_file(f"{base}/features/portal/customer/requests/RequestList.tsx", r"import \{ requestsApi, RequestItem \} from '\.\./\.\./\.\./\.\./api/requests';", "import { requestsApi } from '../../../../api/requests';\nimport type { RequestItem } from '../../../../api/requests';")
replace_in_file(f"{base}/features/portal/staff/orders/StaffOrderList.tsx", r"import \{ ordersApi, OrderItem \} from '\.\./\.\./\.\./\.\./api/orders';", "import { ordersApi } from '../../../../api/orders';\nimport type { OrderItem } from '../../../../api/orders';")

replace_in_file(f"{base}/providers/AuthProvider.tsx", r"import \{ ReactNode, useEffect \} from 'react';", "import { useEffect } from 'react';\nimport type { ReactNode } from 'react';")
replace_in_file(f"{base}/shared/components/ErrorBoundary.tsx", r"import \{ Component, ErrorInfo, ReactNode \} from 'react';", "import { Component } from 'react';\nimport type { ErrorInfo, ReactNode } from 'react';")

# 7. Add EmptyState missing imports
replace_in_file(f"{base}/features/portal/customer/orders/OrderList.tsx", r"import \{ PageContainer \} from '\.\./\.\./\.\./\.\./shared/components/PageContainer';", "import { PageContainer } from '../../../../shared/components/PageContainer';\nimport { EmptyState } from '../../../../shared/components/EmptyState';")
replace_in_file(f"{base}/features/portal/customer/products/ProductList.tsx", r"import \{ PageContainer \} from '\.\./\.\./\.\./\.\./shared/components/PageContainer';", "import { PageContainer } from '../../../../shared/components/PageContainer';\nimport { EmptyState } from '../../../../shared/components/EmptyState';")
replace_in_file(f"{base}/features/portal/staff/orders/StaffOrderList.tsx", r"import \{ PageContainer \} from '\.\./\.\./\.\./\.\./shared/components/PageContainer';", "import { PageContainer } from '../../../../shared/components/PageContainer';\nimport { EmptyState } from '../../../../shared/components/EmptyState';")
replace_in_file(f"{base}/features/portal/staff/products/StaffProductList.tsx", r"import \{ PageContainer \} from '\.\./\.\./\.\./\.\./shared/components/PageContainer';", "import { PageContainer } from '../../../../shared/components/PageContainer';\nimport { EmptyState } from '../../../../shared/components/EmptyState';")
replace_in_file(f"{base}/features/portal/staff/requests/StaffRequestList.tsx", r"import \{ PageContainer \} from '\.\./\.\./\.\./\.\./shared/components/PageContainer';", "import { PageContainer } from '../../../../shared/components/PageContainer';\nimport { EmptyState } from '../../../../shared/components/EmptyState';")

# 8. Unused variables
replace_in_file(f"{base}/features/portal/customer/quotes/QuoteDetail.tsx", r"onError: \(err, newTodo, context\) => \{", "onError: (_err, _newTodo, context) => {")
replace_in_file(f"{base}/features/portal/customer/quotes/QuoteDetail.tsx", r"onSuccess: \(data, variables\) => \{", "onSuccess: (_data, variables) => {")

replace_in_file(f"{base}/features/portal/customer/requests/RequestDetail.tsx", r"const navigate = useNavigate\(\);\n", "")
replace_in_file(f"{base}/features/portal/customer/requests/RequestDetail.tsx", r"import \{ useParams, Link, useNavigate \} from 'react-router-dom';", "import { useParams, Link } from 'react-router-dom';")
replace_in_file(f"{base}/features/portal/customer/requests/RequestDetail.tsx", r"const \{ data: quotes, isLoading: loadingQuotes \} = useQuery", "const { data: quotes } = useQuery")
replace_in_file(f"{base}/features/portal/customer/requests/RequestDetail.tsx", r"onError: \(err, newTodo, context\) => \{", "onError: (_err, _newTodo, context) => {")
replace_in_file(f"{base}/features/portal/customer/requests/RequestDetail.tsx", r"mutationFn: \(\) => requestsApi\.cancel\(id!\),", "mutationFn: () => requestsApi.cancel(id!, 'Cancelled by customer'),")

replace_in_file(f"{base}/features/portal/staff/orders/StaffOrderDetail.tsx", r"onError: \(err, newTodo, context\) => \{", "onError: (_err, _newTodo, context) => {")
replace_in_file(f"{base}/features/portal/staff/orders/StaffOrderDetail.tsx", r"order\.items\?", "order.order_items?")

replace_in_file(f"{base}/features/portal/staff/products/StaffProductList.tsx", r"import \{ useState \} from 'react';\n", "")
replace_in_file(f"{base}/features/portal/staff/requests/StaffRequestDetail.tsx", r"import \{ useParams, Link, useNavigate \} from 'react-router-dom';", "import { useParams, Link } from 'react-router-dom';")
replace_in_file(f"{base}/features/portal/staff/requests/StaffRequestDetail.tsx", r"const navigate = useNavigate\(\);\n", "")
replace_in_file(f"{base}/features/portal/staff/requests/StaffRequestDetail.tsx", r"import \{ useAuthStore \} from '\.\./\.\./\.\./\.\./store/authStore';\n", "")
replace_in_file(f"{base}/features/portal/staff/requests/StaffRequestDetail.tsx", r"const user = useAuthStore\(state => state\.user\);\n", "")

replace_in_file(f"{base}/features/portal/staff/requests/StaffRequestList.tsx", r"import \{ useState \} from 'react';\n", "")

replace_in_file(f"{base}/layouts/PortalLayout.tsx", r"import \{ PageContainer \} from '\.\./shared/components/PageContainer';\n", "")
