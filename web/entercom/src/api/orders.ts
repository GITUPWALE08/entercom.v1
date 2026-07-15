import { apiClient } from './axios';

export interface OrderItem {
  id: string;
  status: string;
  total_amount: string;
  created_at: string;
  items?: any[];
}

export const ordersApi = {
  list: async () => {
    const { data } = await apiClient.get<OrderItem[]>('/orders/');
    return data;
  },
  get: async (id: string) => {
    const { data } = await apiClient.get<OrderItem>(`/orders/${id}/`);
    return data;
  },
  cancel: async (id: string, reason: string) => {
    const { data } = await apiClient.post<OrderItem>(`/orders/${id}/cancel/`, { reason });
    return data;
  },
  fulfill: async (id: string) => {
    const { data } = await apiClient.post<OrderItem>(`/orders/${id}/fulfill/`);
    return data;
  },
  create: async (payload: { request_id?: string, requires_technician?: boolean, items: { product_id: string, quantity: number }[] }) => {
    const { data } = await apiClient.post<OrderItem>('/orders/', payload);
    return data;
  }
};
