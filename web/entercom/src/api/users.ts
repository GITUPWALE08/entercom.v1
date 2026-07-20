import { normalizeData } from './normalize';
import { apiClient } from './axios';

export interface UserRole {
  id: string;
  role: {
    id: string;
    slug: string;
    name: string;
  };
  is_active: boolean;
  assigned_by: string;
}

export interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  is_active: boolean;
  phone_number?: string;
  address?: string;
  profile_image?: string;
  mfa_enabled?: boolean;
  role_assignments: UserRole[];
}

export const usersApi = {
  list: async (): Promise<User[]> => {
    const { data } = await apiClient.get<User[]>('/users/');
    return normalizeData(data);
  },

  assignRole: async (userId: string, roleSlug: string, reason: string = ''): Promise<void> => {
    await apiClient.post(`/users/${userId}/assign_role/`, { role_slug: roleSlug, reason });
  },

  deassignRole: async (userId: string, roleSlug: string): Promise<void> => {
    await apiClient.post(`/users/${userId}/deassign_role/`, { role_slug: roleSlug });
  },

  getProfile: async (): Promise<User> => {
    const { data } = await apiClient.get<User>('/users/me/');
    return normalizeData(data);
  },

  updateProfile: async (profileData: Partial<User>): Promise<User> => {
    const { data } = await apiClient.patch<User>('/users/me/', profileData);
    return normalizeData(data);
  }
};
