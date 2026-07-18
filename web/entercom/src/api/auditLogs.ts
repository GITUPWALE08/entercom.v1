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

export const auditLogsApi = {
  list: async () => {
    const { data } = await apiClient.get<AuditLogItem[]>('/audit-logs/');
    return normalizeData(data);
  },

  export: async () => {
    const { data } = await apiClient.get<any>('/audit-logs/export/', { responseType: 'blob' });
    return normalizeData(data);
  }
};
