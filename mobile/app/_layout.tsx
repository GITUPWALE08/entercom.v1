import { useEffect, useState } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { useAuthStore } from '../src/store/authStore';
// @ts-ignore
import '../global.css';

export default function RootLayout() {
  const { isAuthenticated, loadStoredToken } = useAuthStore() as any;
  const segments = useSegments();
  const router = useRouter();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    // @ts-ignore
    loadStoredToken?.();
  }, []);

  useEffect(() => {
    if (!isMounted) return;

    const inAuthGroup = segments[0] === '(auth)';

    if (!isAuthenticated && !inAuthGroup) {
      router.replace('/(auth)/login');
    } else if (isAuthenticated && inAuthGroup) {
      router.replace('/(tabs)');
    }
  }, [isAuthenticated, segments, isMounted]);

  return (
    <Stack screenOptions={{ headerShown: false }} />
  );
}
