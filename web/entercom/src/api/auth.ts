import { normalizeData } from './normalize';
import { apiClient } from './axios';
import type { User, AuthTokens } from '../types/auth';

export interface LoginResponse {
  user: User;
  tokens: AuthTokens;
}

export interface RegisterResponse {
  user: User;
  message: string;
}

export const authApi = {
  login: async (credentials: Record<string, string>): Promise<LoginResponse> => {
    const { data } = await apiClient.post<LoginResponse>('/auth/login/', credentials);
    return normalizeData(data);
  },
  register: async (credentials: Record<string, string>): Promise<RegisterResponse> => {
    const { data } = await apiClient.post<RegisterResponse>('/auth/register/', credentials);
    return normalizeData(data);
  },
  verifyEmail: async (token: string): Promise<void> => {
    await apiClient.post('/auth/verify-email/', { token });
  },
  logout: async (refreshToken: string): Promise<void> => {
    await apiClient.post('/auth/logout/', { refresh_token: refreshToken });
  },
  logoutAll: async (): Promise<void> => {
    await apiClient.post('/auth/logout-all/');
  }
};
