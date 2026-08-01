import fs from 'fs';
import path from 'path';

const appDir = path.join(process.cwd(), 'app');
const drawerDir = path.join(appDir, '(drawer)');

if (!fs.existsSync(drawerDir)) {
  fs.mkdirSync(drawerDir, { recursive: true });
}

// 1. Rename tabs to (drawer)/(tabs)
const tabsDir = path.join(appDir, '(tabs)');
if (fs.existsSync(tabsDir)) {
  fs.renameSync(tabsDir, path.join(drawerDir, '(tabs)'));
}

// 2. Create app/(drawer)/_layout.tsx
const drawerLayoutCode = `import { Drawer } from 'expo-router/drawer';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

export default function DrawerLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Drawer screenOptions={{ headerShown: false }}>
        <Drawer.Screen name="(tabs)" options={{ title: 'Home' }} />
        <Drawer.Screen name="payments" options={{ title: 'Payments' }} />
        <Drawer.Screen name="settings" options={{ title: 'Settings' }} />
      </Drawer>
    </GestureHandlerRootView>
  );
}`;
fs.writeFileSync(path.join(drawerDir, '_layout.tsx'), drawerLayoutCode);

// 3. Create app/(drawer)/payments.tsx
const paymentsCode = `import { View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function PaymentsScreen() {
  return (
    <SafeAreaView className="flex-1 bg-white items-center justify-center">
      <Text className="text-xl font-bold">Payments</Text>
    </SafeAreaView>
  );
}`;
fs.writeFileSync(path.join(drawerDir, 'payments.tsx'), paymentsCode);

// 4. Create app/(drawer)/settings.tsx
const settingsCode = `import { View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function SettingsScreen() {
  return (
    <SafeAreaView className="flex-1 bg-white items-center justify-center">
      <Text className="text-xl font-bold">Settings</Text>
    </SafeAreaView>
  );
}`;
fs.writeFileSync(path.join(drawerDir, 'settings.tsx'), settingsCode);

// 5. Update app/_layout.tsx
const rootLayoutPath = path.join(appDir, '_layout.tsx');
let rootLayoutCode = fs.readFileSync(rootLayoutPath, 'utf-8');
rootLayoutCode = rootLayoutCode.replace("router.replace('/(tabs)');", "router.replace('/(drawer)');");
rootLayoutCode = rootLayoutCode.replace("import { Stack, useRouter, useSegments } from 'expo-router';", "import { Stack, useRouter, useSegments } from 'expo-router';\\nimport { GestureHandlerRootView } from 'react-native-gesture-handler';");
rootLayoutCode = rootLayoutCode.replace("<Stack screenOptions={{ headerShown: false }} />", "<GestureHandlerRootView style={{ flex: 1 }}>\\n      <Stack screenOptions={{ headerShown: false }} />\\n    </GestureHandlerRootView>");
fs.writeFileSync(rootLayoutPath, rootLayoutCode);

console.log('Done organizing drawer');
