import { apiClient } from './axios';

export interface PaymentItem {
  id: string;
  order_id: string;
  status: string;
  amount: string;
  currency: string;
  authorization_url?: string;
  created_at: string;
}

export const paymentsApi = {
  list: async () => {
    const { data } = await apiClient.get<PaymentItem[]>('/payments/');
    return data;
  },
  get: async (id: string) => {
    const { data } = await apiClient.get<PaymentItem>(`/payments/${id}/`);
    return data;
  },
  initialize: async (payload: { order_id: string }) => {
    const { data } = await apiClient.post<PaymentItem>('/payments/initialize/', payload);
    return data;
  },
  cancel: async (id: string, reason?: string) => {
    const { data } = await apiClient.post<PaymentItem>(`/payments/${id}/cancel/`, { reason });
    return data;
  },
  refund: async (id: string, reason?: string) => {
    const { data } = await apiClient.post<PaymentItem>(`/payments/${id}/refund/`, { reason });
    return data;
  },
  escalate: async (id: string, reason: string) => {
    const { data } = await apiClient.post<PaymentItem>(`/payments/${id}/escalate/`, { reason });
    return data;
  },
  simulateWebhook: async (reference: string) => {
    const { data } = await apiClient.post('/payments/webhooks/paystack/', {
      event: 'charge.success',
      data: { reference }
    });
    return data;
  }
};
