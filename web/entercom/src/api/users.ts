import { normalizeData } from './normalize';
import { apiClient } from './axios';
import { supabase } from '../lib/supabase';

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

  uploadProfileImage: async (file: File): Promise<{profile_image: string}> => {
    const filename = `avatars/${Date.now()}_${Math.random().toString(36).substring(7)}_${file.name}`;

    const { error: uploadError } = await supabase.storage
      .from('entercom-media')
      .upload(filename, file, { contentType: file.type });

    if (uploadError) throw uploadError;

    const { data: publicUrlData } = supabase.storage
      .from('entercom-media')
      .getPublicUrl(filename);

    const publicUrl = publicUrlData.publicUrl;

    // Update profile on backend with the new URL
    await usersApi.updateProfile({ profile_image: publicUrl });

    return { profile_image: publicUrl };
  }
};
