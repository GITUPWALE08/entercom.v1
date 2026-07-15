import { useNavigate } from 'react-router-dom';
import { authApi } from '../api/auth';
import { useAuthStore } from '../store/authStore';
import { apiClient } from '../api/axios';

export function useLogout() {
  const navigate = useNavigate();
  const { logout: clearStore } = useAuthStore();

  const logout = async () => {
    try {
      const refreshToken = localStorage.getItem('refresh_token');
      if (refreshToken) {
        await authApi.logout(refreshToken);
      }
    } catch (e) {
      console.error('Backend logout failed, proceeding with local cleanup', e);
    } finally {
      // Clear localStorage tokens
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      
      // Clear axios defaults
      delete apiClient.defaults.headers.common.Authorization;

      // Clear Zustand state (persisted state automatically syncs)
      clearStore();

      // Redirect to login
      navigate('/login');
    }
  };

  return { logout };
}
