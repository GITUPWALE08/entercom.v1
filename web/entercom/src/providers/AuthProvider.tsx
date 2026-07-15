import { useEffect } from 'react';
import type { ReactNode } from 'react';
import { useAuthStore } from '../store/authStore';
import { LoadingScreen } from '../shared/components/LoadingScreen';

export function AuthProvider({ children }: { children: ReactNode }) {
  const { isInitialized, setInitialized } = useAuthStore();

  useEffect(() => {
    // Session is already restored by Zustand persist middleware from localStorage.
    // If we had a /me endpoint, we would verify the token here.
    // Since we don't, we simply assume the token is valid until an API request fails with 401.
    setInitialized(true);
  }, [setInitialized]);

  if (!isInitialized) {
    return <LoadingScreen />;
  }

  return <>{children}</>;
}
