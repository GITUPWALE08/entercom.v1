import { normalizeData } from './normalize';
import { apiClient } from './axios';
import { supabase } from '../lib/supabase';
import * as FileSystem from 'expo-file-system';
import { decode } from 'base64-arraybuffer';

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
  role?: string;
  role_assignments: UserRole[];
}

export const usersApi = {
  list: async (role?: string): Promise<User[]> => {
    const url = role ? `/users/?role=${role}` : '/users/';
    const { data } = await apiClient.get<User[]>(url);
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
  },
  
  uploadProfileImage: async (imageUri: string, mimeType: string = 'image/jpeg'): Promise<{profile_image: string}> => {
    const formData = new FormData();
    formData.append('image', {
      uri: imageUri,
      name: `avatar_${Date.now()}.jpg`,
      type: mimeType
    } as any);

    // Upload directly to Django API
    const { data } = await apiClient.post<{profile_image: string}>('/users/upload-image/', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return data;
  },
  
  registerPushDevice: async (token: string, deviceType: string): Promise<void> => {
    await apiClient.post('/users/register-device/', { token, device_type: deviceType });
  }
};
