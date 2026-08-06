import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, Pressable, Switch } from 'react-native';
import { router } from 'expo-router';
import { ArrowLeft, Bell, Moon, Shield, Smartphone, Globe, ChevronRight } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as LocalAuthentication from 'expo-local-authentication';
import Constants from 'expo-constants';

export default function AppSettingsScreen() {
  const [pushNotifications, setPushNotifications] = useState(true);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [biometrics, setBiometrics] = useState(false);

  useEffect(() => {
    // Load preferences
    const loadPreferences = async () => {
      try {
        const push = await AsyncStorage.getItem('@app_settings_push');
        const email = await AsyncStorage.getItem('@app_settings_email');
        const dark = await AsyncStorage.getItem('@app_settings_dark');
        const bio = await AsyncStorage.getItem('@app_settings_bio');
        
        if (push !== null) setPushNotifications(push === 'true');
        if (email !== null) setEmailNotifications(email === 'true');
        if (dark !== null) setDarkMode(dark === 'true');
        if (bio !== null) setBiometrics(bio === 'true');
      } catch (e) {
        console.error('Failed to load settings', e);
      }
    };
    loadPreferences();
  }, []);

  const toggleSwitch = async (key: string, value: boolean, setter: (val: boolean) => void) => {
    setter(value);
    try {
      await AsyncStorage.setItem(key, String(value));
    } catch (e) {
      console.error('Failed to save setting', e);
    }
  };

  const toggleBiometrics = async (value: boolean) => {
    if (value) {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();
      
      if (!hasHardware || !isEnrolled) {
        alert('Biometric authentication is not available or not set up on this device.');
        return;
      }

      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Authenticate to enable biometrics',
        fallbackLabel: 'Use Passcode',
      });

      if (result.success) {
        toggleSwitch('@app_settings_bio', true, setBiometrics);
      } else {
        alert('Authentication failed.');
      }
    } else {
      toggleSwitch('@app_settings_bio', false, setBiometrics);
    }
  };

  const SettingRow = ({ icon: Icon, title, description, value, onToggle, isToggle = true }: any) => (
    <View className="flex-row items-center justify-between py-4 border-b border-gray-100">
      <View className="flex-row items-center flex-1 pr-4">
        <View className="bg-gray-50 p-3 rounded-full mr-4">
          <Icon size={22} color="#4b5563" />
        </View>
        <View className="flex-1">
          <Text className="text-base font-bold text-gray-900">{title}</Text>
          {description && <Text className="text-xs text-gray-500 mt-1">{description}</Text>}
        </View>
      </View>
      {isToggle ? (
        <Switch
          trackColor={{ false: '#d1d5db', true: '#93c5fd' }}
          thumbColor={value ? '#2563eb' : '#f3f4f6'}
          ios_backgroundColor="#d1d5db"
          onValueChange={onToggle}
          value={value}
        />
      ) : (
        <ChevronRight size={20} color="#9ca3af" />
      )}
    </View>
  );

  const togglePushNotifications = async (value: boolean) => {
    setPushNotifications(value);
    try {
      await AsyncStorage.setItem('@app_settings_push', String(value));
      if (value) {
        if (Constants.appOwnership !== 'expo') {
          // You could call registerForPushNotificationsAsync here and then usersApi.registerPushDevice
          alert('Push notifications enabled for this device.');
        } else {
          alert('Push notifications are not supported inside Expo Go.');
        }
      }
    } catch (e) {
      console.error('Failed to save push setting', e);
    }
  };

  return (
    <View className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="bg-white pt-16 pb-4 px-6 flex-row items-center justify-between border-b border-gray-100 z-10">
        <Pressable onPress={() => router.back()} className="p-2 -ml-2 bg-gray-50 rounded-full">
          <ArrowLeft size={24} color="#1f2937" />
        </Pressable>
        <Text className="text-xl font-bold text-gray-900">App Settings</Text>
        <View className="w-10" />
      </View>

      <ScrollView className="flex-1" contentContainerStyle={{ padding: 24, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
        
        {/* Notifications Section */}
        <Text className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-2 ml-1">Notifications</Text>
        <View className="bg-white rounded-2xl shadow-sm border border-gray-100 px-5 mb-6">
          <SettingRow
            icon={Bell}
            title="Push Notifications"
            description="Receive alerts on your device"
            value={pushNotifications}
            onToggle={togglePushNotifications}
          />
          <SettingRow
            icon={Smartphone}
            title="Email Notifications"
            description="Receive updates via email"
            value={emailNotifications}
            onToggle={(val: boolean) => toggleSwitch('@app_settings_email', val, setEmailNotifications)}
          />
        </View>

        {/* Display & Accessibility Section */}
        <Text className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-2 ml-1">Display & Accessibility</Text>
        <View className="bg-white rounded-2xl shadow-sm border border-gray-100 px-5 mb-6">
          <SettingRow
            icon={Moon}
            title="Dark Mode"
            description="Switch to dark theme"
            value={darkMode}
            onToggle={(val: boolean) => toggleSwitch('@app_settings_dark', val, setDarkMode)}
          />
          <SettingRow
            icon={Globe}
            title="Language"
            description="English (US)"
            isToggle={false}
          />
        </View>

        {/* Security Section */}
        <Text className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-2 ml-1">Security</Text>
        <View className="bg-white rounded-2xl shadow-sm border border-gray-100 px-5 mb-6">
          <SettingRow
            icon={Shield}
            title="Biometric Authentication"
            description="Use Face ID / Touch ID"
            value={biometrics}
            onToggle={toggleBiometrics}
          />
        </View>

      </ScrollView>
    </View>
  );
}
