import { ensureArray } from '../utils/arrays';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { ProductItem } from '../api/products';

export interface CartItem {
  product: ProductItem;
  quantity: number;
}

interface CartState {
  items: CartItem[];
  addItem: (product: ProductItem, quantity?: number) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
}

export const useCartStore = create<CartState>()(
  persist(
    (set) => ({
      items: [],
      addItem: (product, quantity = 1) => set((state) => {
        const existingItem = ensureArray(state.items).find((item: CartItem) => item.product.id === product.id);
        if (existingItem) {
          return {
            items: ensureArray(state.items).map((item: CartItem) => 
              item.product.id === product.id 
                ? { ...item, quantity: item.quantity + quantity }
                : item
            )
          };
        }
        return { items: [...state.items, { product, quantity }] };
      }),
      removeItem: (productId) => set((state) => ({
        items: ensureArray(state.items).filter((item: CartItem) => item.product.id !== productId)
      })),
      updateQuantity: (productId, quantity) => set((state) => {
        if (quantity <= 0) {
          return { items: ensureArray(state.items).filter((item: CartItem) => item.product.id !== productId) };
        }
        return {
          items: ensureArray(state.items).map((item: CartItem) => 
            item.product.id === productId ? { ...item, quantity } : item
          )
        };
      }),
      clearCart: () => set({ items: [] }),
    }),
    {
      name: 'ess-cart-storage',
    }
  )
);
