import { useEffect, useState } from 'react';
import { Stack, useRouter, useSegments, SplashScreen } from 'expo-router';
import { Platform, View } from 'react-native';
import { useAuthStore } from '../src/store/authStore';
import { useWebsocket } from '../src/hooks/useWebsocket';
import * as ExpoNotifications from 'expo-notifications';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
// @ts-ignore
import '../global.css';

// Only import GestureHandlerRootView on native — it breaks web
let GestureHandlerRootView: any = ({ children, style }: any) => (
  <View style={[{ flex: 1 }, style]}>{children}</View>
);
if (Platform.OS !== 'web') {
  GestureHandlerRootView = require('react-native-gesture-handler').GestureHandlerRootView;
}

ExpoNotifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: true,
    },
  },
});

export default function RootLayout() {
  const { isAuthenticated, isInitialized } = useAuthStore() as any;
  const segments = useSegments();
  const router = useRouter();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (isInitialized && isMounted) {
      SplashScreen.hideAsync();
    }
  }, [isInitialized, isMounted]);

  // Initialize global websocket for real-time events
  useWebsocket({
    channel: 'requests',
    onEventReceived: (event) => {
      console.log('[Real-Time Event]', event);
      // In a real app, we'd dispatch to a store or invalidate react-query caches here
    }
  });

  useEffect(() => {
    if (!isMounted || !isInitialized) return;

    const inAuthGroup = segments[0] === '(auth)';

    if (!isAuthenticated && !inAuthGroup) {
      router.replace('/(auth)/login');
    } else if (isAuthenticated && inAuthGroup) {
      router.replace('/(drawer)');
    }
  }, [isAuthenticated, segments, isMounted, isInitialized]);

  if (!isInitialized || !isMounted) {
    return null;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <Stack screenOptions={{ headerShown: false }} />
      </GestureHandlerRootView>
    </QueryClientProvider>
  );
}
