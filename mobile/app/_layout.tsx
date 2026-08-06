import { useEffect, useState } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { Platform, View } from 'react-native';
import { useAuthStore } from '../src/store/authStore';
// @ts-ignore
import '../global.css';

// Only import GestureHandlerRootView on native — it breaks web
let GestureHandlerRootView: any = ({ children, style }: any) => (
  <View style={[{ flex: 1 }, style]}>{children}</View>
);
if (Platform.OS !== 'web') {
  GestureHandlerRootView = require('react-native-gesture-handler').GestureHandlerRootView;
}

export default function RootLayout() {
  const { isAuthenticated, isInitialized } = useAuthStore() as any;
  const segments = useSegments();
  const router = useRouter();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!isMounted || !isInitialized) return;

    const inAuthGroup = segments[0] === '(auth)';

    if (!isAuthenticated && !inAuthGroup) {
      router.replace('/(auth)/login');
    } else if (isAuthenticated && inAuthGroup) {
      router.replace('/(drawer)');
    }
  }, [isAuthenticated, segments, isMounted, isInitialized]);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Stack screenOptions={{ headerShown: false }} />
    </GestureHandlerRootView>
  );
}
