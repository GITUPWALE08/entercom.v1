import React, { useState } from 'react';
import { Drawer } from 'expo-router/drawer';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { View, Text, Pressable, Image } from 'react-native';
import { DrawerContentScrollView } from '@react-navigation/drawer';
import { useAuthStore } from '../../src/store/authStore';
import { LogOut, Home, CreditCard, Settings, ShieldCheck, ShoppingCart, Package, Briefcase, GraduationCap, Wrench, ChevronDown, ChevronRight, UserCircle, CalendarDays, ClipboardList } from 'lucide-react-native';
import { Avatar } from '../../src/components/ui/Avatar';
import { router } from 'expo-router';

function DrawerCustomItem({ icon: Icon, label, onPress, indent = false }: any) {
  return (
    <Pressable 
      onPress={onPress}
      className={`flex-row items-center px-4 py-3 rounded-2xl mb-1 active:bg-gray-100 ${indent ? 'ml-8' : ''}`}
    >
      <Icon size={24} color="#6b7280" />
      <Text className="text-gray-600 font-semibold text-[16px] ml-3">{label}</Text>
    </Pressable>
  );
}

function CustomDrawerContent(props: any) {
  const { user, logout } = useAuthStore() as any;
  const [careersExpanded, setCareersExpanded] = useState(false);

  const handleLogout = () => {
    logout();
    router.replace('/(auth)/login');
  };

  return (
    <View className="flex-1 bg-white">
      <DrawerContentScrollView {...props} contentContainerStyle={{ paddingTop: 0 }}>
        {/* Premium Drawer Header */}
        <View className="bg-ess-darkPurple px-6 pt-16 pb-8 mb-4 relative overflow-hidden rounded-br-[40px]">
          <View className="absolute -top-10 -right-10 w-40 h-40 bg-ess-purple rounded-full opacity-30 blur-2xl" />
          
          <View className="flex-row items-center mb-4">
            <ShieldCheck size={28} color="#ffffff" className="mr-2" />
            <Text className="text-white font-extrabold text-[22px] tracking-tight">Entercom</Text>
          </View>
          
          <View className="flex-row items-center mt-4">
            <Avatar size="lg" fallback={user?.first_name?.[0] || 'U'} className="mr-4 border-2 border-white/20" />
            <View className="flex-1">
              <Text className="text-white font-bold text-[18px] tracking-tight" numberOfLines={1}>
                {user?.first_name ? `${user.first_name} ${user.last_name || ''}` : 'Jane Doe'}
              </Text>
              <Text className="text-indigo-200 text-[13px] font-medium mt-0.5" numberOfLines={1}>
                {user?.email || 'jane.doe@example.com'}
              </Text>
            </View>
          </View>
        </View>

        {/* Home - top of sidebar */}
        <View className="px-3 border-b border-gray-100 pb-2 mb-2">
          <DrawerCustomItem icon={Home} label="Dashboard" onPress={() => router.push('/(drawer)/(tabs)/')} />
        </View>

        {/* Custom Navigation */}
        <View className="px-3 mt-2">

          {/* Main Pages */}
          <Text className="text-gray-400 font-bold text-xs uppercase tracking-wider px-4 mb-2">My Account</Text>
          <DrawerCustomItem icon={UserCircle} label="My Profile" onPress={() => router.push('/(drawer)/(tabs)/profile')} />
          <DrawerCustomItem icon={CalendarDays} label="Bookings" onPress={() => router.push('/(drawer)/(tabs)/bookings')} />
          <DrawerCustomItem icon={ClipboardList} label="Requests" onPress={() => router.push('/(drawer)/(tabs)/requests')} />
          <DrawerCustomItem icon={CreditCard} label="Payments" onPress={() => router.push('/(screens)/payments')} />

          {/* Shop & Orders */}
          <Text className="text-gray-400 font-bold text-xs uppercase tracking-wider px-4 mt-6 mb-2">Shop & Orders</Text>
          <DrawerCustomItem icon={ShoppingCart} label="My Cart" onPress={() => router.push('/(screens)/cart')} />
          <DrawerCustomItem icon={Package} label="My Orders" onPress={() => router.push('/(screens)/orders')} />

          {/* Careers */}
          <Text className="text-gray-400 font-bold text-xs uppercase tracking-wider px-4 mt-6 mb-2">Join Entercom</Text>
          <Pressable 
            onPress={() => setCareersExpanded(!careersExpanded)}
            className="flex-row items-center justify-between px-4 py-3 rounded-2xl mb-1 active:bg-gray-100"
          >
            <View className="flex-row items-center">
              <Briefcase size={24} color="#6b7280" />
              <Text className="text-gray-600 font-semibold text-[16px] ml-3">Careers</Text>
            </View>
            {careersExpanded ? <ChevronDown size={20} color="#6b7280" /> : <ChevronRight size={20} color="#6b7280" />}
          </Pressable>

          {careersExpanded && (
            <View className="mb-2">
              <DrawerCustomItem indent icon={Wrench} label="Technician" onPress={() => router.push('/(screens)/careers/technician')} />
              <DrawerCustomItem indent icon={GraduationCap} label="Internship" onPress={() => router.push('/(screens)/careers/internship')} />
              <DrawerCustomItem indent icon={Briefcase} label="Corporate Staff" onPress={() => router.push('/(screens)/careers/staff')} />
            </View>
          )}
        </View>
      </DrawerContentScrollView>

      {/* Logout Button Pinned to Bottom */}
      <View className="p-6 border-t border-gray-100 mb-6 bg-white">
        <Pressable 
          onPress={handleLogout}
          className="flex-row items-center bg-red-50 p-4 rounded-2xl"
        >
          <View className="bg-red-100 p-2 rounded-xl mr-3">
            <LogOut size={20} color="#ef4444" />
          </View>
          <Text className="text-red-600 font-bold text-[16px]">Sign Out</Text>
        </Pressable>
      </View>
    </View>
  );
}

export default function DrawerLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Drawer 
        drawerContent={(props) => <CustomDrawerContent {...props} />}
        screenOptions={{ 
          headerShown: false,
          drawerActiveBackgroundColor: '#f5f7fa',
          drawerActiveTintColor: '#0f4c81', // ess.darkPurple
          drawerInactiveTintColor: '#6b7280',
          drawerLabelStyle: {
            fontFamily: 'System',
            fontSize: 16,
            fontWeight: '600',
            marginLeft: -10,
          },
          drawerItemStyle: {
            borderRadius: 16,
            paddingVertical: 4,
            marginBottom: 8,
          }
        }}
      >
        <Drawer.Screen 
          name="(tabs)" 
          options={{ 
            title: 'Dashboard',
            drawerIcon: ({ color, size }) => <Home size={size} color={color} />
          }} 
        />
        <Drawer.Screen 
          name="payments" 
          options={{ 
            title: 'Billing & Payments',
            drawerIcon: ({ color, size }) => <CreditCard size={size} color={color} />
          }} 
        />
        <Drawer.Screen 
          name="settings" 
          options={{ 
            title: 'Settings',
            drawerIcon: ({ color, size }) => <Settings size={size} color={color} />
          }} 
        />
      </Drawer>
    </GestureHandlerRootView>
  );
}