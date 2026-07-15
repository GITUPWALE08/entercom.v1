import { apiClient } from './axios';

export interface ProductItem {
  id: string;
  name: string;
  price: string;
  description?: string;
  status: string;
  images?: { id: string, image: string, display_order: number }[];
  category?: string;
  quantity_available: number;
  low_stock_threshold?: number;
  sku?: string;
}

export const productsApi = {
  list: async () => {
    const { data } = await apiClient.get<ProductItem[]>('/products/');
    return data;
  },
  get: async (id: string) => {
    const { data } = await apiClient.get<ProductItem>(`/products/${id}/`);
    return data;
  },
  create: async (payload: any) => {
    const { data } = await apiClient.post<ProductItem>(`/products/`, payload);
    return data;
  },
  update: async (id: string, payload: any) => {
    const { data } = await apiClient.patch<ProductItem>(`/products/${id}/`, payload);
    return data;
  },
  archive: async (id: string) => {
    const { data } = await apiClient.post<ProductItem>(`/products/${id}/archive/`);
    return data;
  },
  adjust_inventory: async (id: string, payload: { adjustment_amount: number, reason: string }) => {
    const { data } = await apiClient.post<ProductItem>(`/products/${id}/inventory-adjust/`, payload);
    return data;
  },
  categories: {
    list: async () => {
      const { data } = await apiClient.get('/categories/');
      return data;
    }
  }
};
