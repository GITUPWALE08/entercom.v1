import { apiClient } from './axios';

export interface AnalyticsKPIs {
  [key: string]: any;
}

export interface AnalyticsAlert {
  id?: string;
  type?: string;
  message?: string;
  severity?: string;
  title?: string;
  description?: string;
  [key: string]: any;
}

export interface AnalyticsChart {
  [key: string]: any;
}

export interface AnalyticsResponse {
  kpis: AnalyticsKPIs;
  alerts: AnalyticsAlert[];
  charts: any;
}

export interface AnalyticsParams {
  period?: 'today' | '7_days' | '30_days' | '90_days' | 'custom';
  start_date?: string;
  end_date?: string;
}

export const analyticsApi = {
  getAdminDashboard: async (params?: AnalyticsParams): Promise<AnalyticsResponse> => {
    const response = await apiClient.get('/analytics/admin/', { params });
    return response.data;
  },
  getManagerDashboard: async (params?: AnalyticsParams): Promise<AnalyticsResponse> => {
    const response = await apiClient.get('/analytics/manager/', { params });
    return response.data;
  },
};
