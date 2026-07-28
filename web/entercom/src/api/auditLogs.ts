import { normalizeData } from './normalize';
import { apiClient } from './axios';

export interface AuditLogItem {
  id: string;
  actor_id?: string;
  action: string;
  resource_type: string;
  resource_id?: string;
  metadata?: Record<string, any>;
  ip_address?: string;
  user_agent?: string;
  status: string;
  created_at: string;
}

export interface AuditLogFilters {
  action?: string;
  actor_email?: string;
  resource_type?: string;
  correlation_id?: string;
  date_from?: string;
  date_to?: string;
  page?: number;
}

export const auditLogsApi = {
  list: async (filters?: AuditLogFilters): Promise<AuditLogItem[]> => {
    const { data } = await apiClient.get<any>('/audit-logs/', { params: filters });
    return normalizeData<AuditLogItem[]>(data);
  },

  export: async (filters?: AuditLogFilters, format: string = 'csv') => {
    const { data } = await apiClient.get<any>('/audit-logs/export/', { 
      params: { ...filters, format },
      responseType: 'blob' 
    });
    return data; // Return blob directly for export
  }
};
