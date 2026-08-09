import { normalizeData } from './normalize';
import { apiClient } from './axios';
import type { User, AuthTokens } from '../types/auth';

export interface LoginResponse {
  user: User;
  tokens: AuthTokens;
  mfa_required?: boolean;
  mfa_session?: string;
  message?: string;
}

export interface RegisterResponse {
  user: User;
  message: string;
}

export const authApi = {
  login: async (credentials: Record<string, string>): Promise<LoginResponse> => {
    const { data } = await apiClient.post<LoginResponse>('/auth/login/', credentials);
    if (data.mfa_required) return data;
    return normalizeData(data);
  },
  verifyMfa: async (mfaSession: string, otp: string): Promise<LoginResponse> => {
    const { data } = await apiClient.post<LoginResponse>('/auth/verify-mfa/', { mfa_session: mfaSession, otp });
    return normalizeData(data);
  },
  resendMfa: async (mfaSession: string): Promise<void> => {
    await apiClient.post('/auth/resend-mfa/', { mfa_session: mfaSession });
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
  },
  requestPasswordReset: async (email: string): Promise<void> => {
    await apiClient.post('/auth/request-password-reset/', { email });
  },
  resetPassword: async (data: Record<string, string>): Promise<void> => {
    await apiClient.post('/auth/reset-password/', data);
  }
};
