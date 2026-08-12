import { useEffect, useState } from 'react';
import { Stack, useRouter, useSegments, SplashScreen } from 'expo-router';
import { Platform, View, Alert } from 'react-native';
import { useAuthStore } from '../src/store/authStore';
import { useWebsocket } from '../src/hooks/useWebsocket';
import * as ExpoNotifications from 'expo-notifications';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
// @ts-ignore
import '../global.css';
import { AlertPopup } from '../src/components/ui/AlertPopup';
import { useAlertStore } from '../src/store/alertStore';

// Overwrite global alert
declare global {
  var showAppAlert: (titleOrMsg: string, messageOrType?: any, typeOrButtons?: any) => void;
}

global.showAppAlert = (titleOrMsg: string, messageOrType?: any, typeOrButtons?: any) => {
  let title = '';
  let message = titleOrMsg;
  let type: any = 'info';
  let buttons: any = undefined;

  // If second arg is a string (and it's not a type like 'success'/'error'), it means it was called as Alert.alert('Title', 'Message', buttons)
  if (typeof messageOrType === 'string' && !['success', 'error', 'pending', 'cancel', 'info'].includes(messageOrType)) {
    title = titleOrMsg;
    message = messageOrType;
    if (Array.isArray(typeOrButtons)) {
      buttons = typeOrButtons;
    } else {
      type = 'info';
    }
  } else {
    // Was called as showAppAlert(msg, type)
    if (messageOrType) {
      type = messageOrType;
    } else {
      const lower = message.toLowerCase();
      if (lower.includes('error') || lower.includes('fail')) type = 'error';
      else if (lower.includes('success')) type = 'success';
      else if (lower.includes('cancel')) type = 'cancel';
      else if (lower.includes('wait') || lower.includes('pending')) type = 'pending';
    }
  }

  useAlertStore.getState().showAlert({
    title,
    message,
    type,
    buttons
  });
};

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
  const { isAuthenticated, isInitialized, user, logout } = useAuthStore() as any;
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

    if (isAuthenticated) {
      // Allow only CUSTOMER role. Both new RBAC assignments and legacy role fallbacks return 'CUSTOMER'.
      const roleStr = user?.role?.toUpperCase();
      if (roleStr && roleStr !== 'CUSTOMER') {
        logout();
        global.showAppAlert('Access Denied', 'The mobile app is strictly for customers only. Please use the web portal.');
        router.replace('/(auth)/login');
        return;
      }
    }

    if (!isAuthenticated && !inAuthGroup) {
      router.replace('/(auth)/login');
    } else if (isAuthenticated && inAuthGroup) {
      router.replace('/(drawer)');
    }
  }, [isAuthenticated, segments, isMounted, isInitialized, user]);

  if (!isInitialized || !isMounted) {
    return null;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <Stack screenOptions={{ headerShown: false }} />
        <AlertPopup />
      </GestureHandlerRootView>
    </QueryClientProvider>
  );
}
