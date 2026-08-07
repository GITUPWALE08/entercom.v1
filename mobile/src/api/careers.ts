import { apiClient } from './axios';

export const careersApi = {
  applyTechnician: async (data: any) => {
    const payload = {
      form_data: data,
      skills: data.certifications ? data.certifications.split(',').map((s: string) => s.trim()) : [],
    };
    const response = await apiClient.post('/users/technician-applications/', payload);
    return response.data;
  },
  getTechnicianApplications: async () => {
    const response = await apiClient.get('/users/technician-applications/');
    return response.data;
  },
  applyInternship: async (data: any) => {
    const response = await apiClient.post('/users/internship-applications/', data); // Adjust if there is an internship endpoint
    return response.data;
  },
  applyStaff: async (data: any) => {
    const response = await apiClient.post('/users/staff-applications/', data); // Adjust if there is a staff endpoint
    return response.data;
  }
};
