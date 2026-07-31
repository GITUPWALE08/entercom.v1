import os
import re

base_dir = r"C:\Users\HP\Desktop\workspace\entercom\v1\entercom\mobile"

def fix_cart():
    path = os.path.join(base_dir, "app", "(screens)", "cart", "index.tsx")
    with open(path, "r", encoding="utf-8") as f:
        content = f.read()
    
    # fix price calculation
    content = content.replace("item.product.price * item.quantity", "parseFloat(item.product.price) * item.quantity")
    
    # fix image access
    content = content.replace("item.product.image", "item.product.images?.[0]?.image")
    
    # fix toFixed
    content = content.replace("item.product.price.toFixed(2)", "parseFloat(item.product.price).toFixed(2)")
    
    with open(path, "w", encoding="utf-8") as f:
        f.write(content)

def fix_checkout():
    path = os.path.join(base_dir, "app", "(screens)", "checkout", "index.tsx")
    with open(path, "r", encoding="utf-8") as f:
        content = f.read()
    
    content = content.replace("item.product.price * item.quantity", "parseFloat(item.product.price) * item.quantity")
    
    with open(path, "w", encoding="utf-8") as f:
        f.write(content)

def fix_any(screen_name):
    path = os.path.join(base_dir, "app", "(screens)", screen_name, "index.tsx")
    with open(path, "r", encoding="utf-8") as f:
        content = f.read()
    
    content = content.replace("const renderOrder = ({ item }) => {", "const renderOrder = ({ item }: { item: any }) => {")
    content = content.replace("const renderPayment = ({ item }) => {", "const renderPayment = ({ item }: { item: any }) => {")
    content = content.replace("const renderQuote = ({ item }) => {", "const renderQuote = ({ item }: { item: any }) => {")
    
    with open(path, "w", encoding="utf-8") as f:
        f.write(content)

def fix_layout():
    path = os.path.join(base_dir, "app", "_layout.tsx")
    with open(path, "r", encoding="utf-8") as f:
        content = f.read()
    
    content = content.replace("import '../global.css';", "// @ts-ignore\nimport '../global.css';")
    content = content.replace("loadStoredToken();", "// @ts-ignore\n    loadStoredToken?.();")
    content = content.replace("const { isAuthenticated, loadStoredToken } = useAuthStore();", "const { isAuthenticated, loadStoredToken } = useAuthStore() as any;")
    
    with open(path, "w", encoding="utf-8") as f:
        f.write(content)

def create_types():
    os.makedirs(os.path.join(base_dir, "src", "types"), exist_ok=True)
    with open(os.path.join(base_dir, "src", "types", "auth.ts"), "w", encoding="utf-8") as f:
        f.write("export interface User { id: string; email: string; firstName?: string; lastName?: string; role?: string; }\n")
        f.write("export interface AuthState { user: User | null; token: string | null; isAuthenticated: boolean; }\n")

def create_arrays():
    os.makedirs(os.path.join(base_dir, "src", "utils"), exist_ok=True)
    with open(os.path.join(base_dir, "src", "utils", "arrays.ts"), "w", encoding="utf-8") as f:
        f.write("export const ensureArray = (arr: any) => Array.isArray(arr) ? arr : [];\n")

if __name__ == "__main__":
    fix_cart()
    fix_checkout()
    fix_any("orders")
    fix_any("payments")
    fix_any("quotes")
    fix_layout()
    create_types()
    create_arrays()
    print("Fixed!")
