import { apiClient } from './axios';

export interface BookingItem {
  id: string;
  request_id: string;
  technician_id: string;
  status: string;
  start_time: string;
  end_time: string;
  duration_days: number;
}

export const bookingsApi = {
  list: async (params?: { start_date?: string, end_date?: string, status?: string, technician_id?: string }) => {
    const { data } = await apiClient.get<BookingItem[]>('/bookings/', { params });
    // Handle standard list vs paginated list response
    return (data as any).results || data; 
  },
  get: async (id: string) => {
    const { data } = await apiClient.get<BookingItem>(`/bookings/${id}/`);
    return data;
  },
  schedule: async (id: string, payload: { start_date: string }) => {
    const { data } = await apiClient.post<BookingItem>(`/bookings/${id}/schedule/`, payload);
    return data;
  },
  reschedule: async (id: string, payload: { new_start_date: string, reason_code?: string }) => {
    const { data } = await apiClient.post<BookingItem>(`/bookings/${id}/reschedule/`, payload);
    return data;
  },
  extend: async (id: string, payload: { new_duration_days: number }) => {
    const { data } = await apiClient.post<BookingItem>(`/bookings/${id}/extend/`, payload);
    return data;
  },
  noShow: async (id: string, payload: { absent_party: string }) => {
    const { data } = await apiClient.post(`/bookings/${id}/no-show/`, payload);
    return data;
  }
};
