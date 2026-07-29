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
  charts: AnalyticsChart[];
}

export const analyticsApi = {
  getAdminDashboard: async (): Promise<AnalyticsResponse> => {
    const response = await apiClient.get('/analytics/admin/');
    return response.data;
  },
  getManagerDashboard: async (): Promise<AnalyticsResponse> => {
    const response = await apiClient.get('/analytics/manager/');
    return response.data;
  },
};
