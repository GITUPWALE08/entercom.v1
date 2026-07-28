import { normalizeData } from './normalize';
import { apiClient } from './axios';

export interface AuditLogItem {
  id: string;
  actor_id?: string;
  actor_name?: string;
  actor_role?: string;
  action: string;
  module?: string;
  severity?: string;
  status?: string;
  resource_type: string;
  resource_id?: string;
  target_type?: string;
  target_id?: string;
  target_display?: string;
  old_values?: any;
  new_values?: any;
  metadata?: Record<string, any>;
  request_method?: string;
  request_path?: string;
  source?: string;
  ip_address?: string;
  user_agent?: string;
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
