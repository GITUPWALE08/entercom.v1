import { apiClient } from './axios';
import type { User, AuthTokens } from '../types/auth';

export interface LoginResponse {
  user: User;
  tokens: AuthTokens;
}

export const authApi = {
  login: async (credentials: Record<string, string>): Promise<LoginResponse> => {
    const { data } = await apiClient.post<LoginResponse>('/auth/login/', credentials);
    return data;
  },
  register: async (credentials: Record<string, string>): Promise<LoginResponse> => {
    const { data } = await apiClient.post<LoginResponse>('/auth/register/', credentials);
    return data;
  },
  logout: async (refreshToken: string): Promise<void> => {
    await apiClient.post('/auth/logout/', { refresh_token: refreshToken });
  },
  logoutAll: async (): Promise<void> => {
    await apiClient.post('/auth/logout-all/');
  }
};
