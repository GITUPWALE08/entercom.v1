import { normalizeData } from './normalize';
import { apiClient } from './axios';

export interface ProductItem {
  id: string;
  name: string;
  price: string;
  description?: string;
  status: string;
  images?: { id: string, image: string, display_order: number }[];
  category?: string;
  category_name?: string;
  quantity_available: number;
  low_stock_threshold?: number;
  sku?: string;
}

export const productsApi = {
  list: async () => {
    const { data } = await apiClient.get<ProductItem[]>('/products/?limit=1000');
    return normalizeData(data);
  },
  get: async (id: string) => {
    const { data } = await apiClient.get<ProductItem>(`/products/${id}/`);
    return normalizeData(data);
  },
  create: async (payload: any) => {
    const { data } = await apiClient.post<ProductItem>(`/products/`, payload);
    return normalizeData(data);
  },
  update: async (id: string, payload: any) => {
    const { data } = await apiClient.patch<ProductItem>(`/products/${id}/`, payload);
    return normalizeData(data);
  },
  archive: async (id: string) => {
    const { data } = await apiClient.post<ProductItem>(`/products/${id}/archive/`);
    return normalizeData(data);
  },
  adjust_inventory: async (id: string, payload: { adjustment_amount: number, reason: string }) => {
    const { data } = await apiClient.post<ProductItem>(`/products/${id}/inventory-adjust/`, payload);
    return normalizeData(data);
  },
  categories: {
    list: async () => {
      const { data } = await apiClient.get('/categories/');
      return normalizeData(data);
    }
  }
};
