import React from 'react';
import { View, Text, ScrollView, Pressable, Switch } from 'react-native';
import { User, Shield, Settings, Wrench, LogOut, ChevronRight, Bell } from 'lucide-react-native';
import { useAuthStore } from '../../src/store/authStore';
import { router } from 'expo-router';

export default function ProfileScreen() {
  const { user, logout } = useAuthStore();

  const handleLogout = () => {
    logout();
    router.replace('/(auth)/login');
  };

  return (
    <ScrollView className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="bg-white pt-16 pb-6 px-6 border-b border-gray-100">
        <Text className="text-3xl font-bold text-gray-900">Profile</Text>
        
        <View className="flex-row items-center mt-6">
          <View className="w-16 h-16 bg-blue-100 rounded-full items-center justify-center border-2 border-white shadow-sm">
            <User size={32} color="#2563eb" />
          </View>
          <View className="ml-4 flex-1">
            <Text className="text-xl font-bold text-gray-900">
              {user?.firstName || 'John'} {user?.lastName || 'Doe'}
            </Text>
            <Text className="text-gray-500 mt-1">{user?.email || 'user@example.com'}</Text>
          </View>
        </View>
      </View>

      <View className="p-6">
        {/* Account Group */}
        <Text className="text-gray-500 text-sm font-semibold uppercase tracking-wider mb-3 ml-2">Account</Text>
        <View className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-6">
          <Pressable onPress={() => router.push('/(screens)/orders')} className="p-4 flex-row items-center justify-between border-b border-gray-50">
            <View className="flex-row items-center">
              <View className="bg-blue-50 p-2 rounded-xl mr-3">
                <User size={20} color="#2563eb" />
              </View>
              <Text className="text-gray-800 text-base font-medium">My Orders</Text>
            </View>
            <ChevronRight size={20} color="#9ca3af" />
          </Pressable>
          
          <Pressable onPress={() => router.push('/(screens)/quotes')} className="p-4 flex-row items-center justify-between border-b border-gray-50">
            <View className="flex-row items-center">
              <View className="bg-emerald-50 p-2 rounded-xl mr-3">
                <Shield size={20} color="#059669" />
              </View>
              <Text className="text-gray-800 text-base font-medium">My Quotes</Text>
            </View>
            <ChevronRight size={20} color="#9ca3af" />
          </Pressable>
          
          <Pressable onPress={() => router.push('/(screens)/payments')} className="p-4 flex-row items-center justify-between border-b border-gray-50">
            <View className="flex-row items-center">
              <View className="bg-purple-50 p-2 rounded-xl mr-3">
                <Bell size={20} color="#7c3aed" />
              </View>
              <Text className="text-gray-800 text-base font-medium">Payment History</Text>
            </View>
            <ChevronRight size={20} color="#9ca3af" />
          </Pressable>
          <Pressable className="p-4 flex-row items-center justify-between border-b border-gray-50">
            <View className="flex-row items-center">
              <View className="bg-blue-50 p-2 rounded-xl mr-3">
                <User size={20} color="#2563eb" />
              </View>
              <Text className="text-gray-800 text-base font-medium">Edit Profile</Text>
            </View>
            <ChevronRight size={20} color="#9ca3af" />
          </Pressable>
          
          <Pressable className="p-4 flex-row items-center justify-between border-b border-gray-50">
            <View className="flex-row items-center">
              <View className="bg-emerald-50 p-2 rounded-xl mr-3">
                <Shield size={20} color="#059669" />
              </View>
              <Text className="text-gray-800 text-base font-medium">Warranty Status</Text>
            </View>
            <ChevronRight size={20} color="#9ca3af" />
          </Pressable>
          
          <View className="p-4 flex-row items-center justify-between">
            <View className="flex-row items-center">
              <View className="bg-gray-100 p-2 rounded-xl mr-3">
                <Bell size={20} color="#4b5563" />
              </View>
              <Text className="text-gray-800 text-base font-medium">Notifications</Text>
            </View>
            <Switch value={true} trackColor={{ false: '#d1d5db', true: '#3b82f6' }} />
          </View>
        </View>

        {/* Support Group */}
        <Text className="text-gray-500 text-sm font-semibold uppercase tracking-wider mb-3 ml-2">Support & Services</Text>
        <View className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-6">
          <Pressable onPress={() => router.push('/(screens)/technician')} className="p-4 flex-row items-center justify-between border-b border-gray-50">
            <View className="flex-row items-center">
              <View className="bg-orange-50 p-2 rounded-xl mr-3">
                <Wrench size={20} color="#ea580c" />
              </View>
              <Text className="text-gray-800 text-base font-medium">Technician Application Portal</Text>
            </View>
            <ChevronRight size={20} color="#9ca3af" />
          </Pressable>

          <Pressable className="p-4 flex-row items-center justify-between">
            <View className="flex-row items-center">
              <View className="bg-gray-100 p-2 rounded-xl mr-3">
                <Settings size={20} color="#4b5563" />
              </View>
              <Text className="text-gray-800 text-base font-medium">App Settings</Text>
            </View>
            <ChevronRight size={20} color="#9ca3af" />
          </Pressable>
        </View>

        {/* Logout */}
        <Pressable 
          onPress={handleLogout}
          className="bg-white rounded-2xl p-4 flex-row items-center justify-center shadow-sm border border-red-100 mt-2 mb-8"
        >
          <LogOut size={20} color="#ef4444" />
          <Text className="text-red-500 text-base font-bold ml-2">Log Out</Text>
        </Pressable>
        
        <Text className="text-center text-gray-400 text-sm pb-10">Version 1.0.0</Text>
      </View>
    </ScrollView>
  );
}
