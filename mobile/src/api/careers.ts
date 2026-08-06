import { apiClient } from './axios';

export const careersApi = {
  applyTechnician: async (data: any) => {
    const response = await apiClient.post('/careers/technician/apply/', data);
    return response.data;
  },
  applyInternship: async (data: any) => {
    const response = await apiClient.post('/careers/internship/apply/', data);
    return response.data;
  },
  applyStaff: async (data: any) => {
    const response = await apiClient.post('/careers/staff/apply/', data);
    return response.data;
  }
};
