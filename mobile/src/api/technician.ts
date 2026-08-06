import { apiClient } from './axios';

export interface TechnicianApplication {
  id: string | number;
  user: string | number;
  skills: string[];
  notes?: string;
  document_urls?: string[];
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
}

export const technicianApi = {
  listApplications: async (): Promise<TechnicianApplication[]> => {
    const response = await apiClient.get('/technician-applications/');
    // Depending on pagination, the result might be in response.data.results
    // For simplicity we assume it returns the array directly or we return response.data
    return response.data?.results || response.data;
  },

  submitApplication: async (data: { skills: string[]; notes?: string; document_urls?: string[] }): Promise<TechnicianApplication> => {
    const response = await apiClient.post('/technician-applications/', data);
    return response.data;
  },
};
