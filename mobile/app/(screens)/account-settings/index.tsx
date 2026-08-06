import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, ScrollView, Pressable, ActivityIndicator, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { router } from 'expo-router';
import { ArrowLeft, User, Phone, MapPin, Save } from 'lucide-react-native';
import { usersApi, User as UserType } from '../../../src/api/users';

export default function AccountSettingsScreen() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<Partial<UserType>>({
    first_name: '',
    last_name: '',
    phone_number: '',
    address: '',
  });
  const [email, setEmail] = useState('');

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const data = await usersApi.getProfile();
      setProfile({
        first_name: data.first_name || '',
        last_name: data.last_name || '',
        phone_number: data.phone_number || '',
        address: data.address || '',
        mfa_enabled: data.mfa_enabled || false,
      });
      setEmail(data.email || '');
    } catch (error) {
      console.error('Failed to load profile:', error);
      Alert.alert('Error', 'Failed to load profile data.');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await usersApi.updateProfile({
        first_name: profile.first_name,
        last_name: profile.last_name,
        phone_number: profile.phone_number,
        address: profile.address,
        mfa_enabled: profile.mfa_enabled,
      });
      Alert.alert('Success', 'Profile updated successfully.');
      router.back();
    } catch (error) {
      console.error('Failed to update profile:', error);
      Alert.alert('Error', 'Failed to update profile.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-gray-50">
        <ActivityIndicator size="large" color="#081f3d" />
        <Text className="text-gray-500 mt-4 font-medium">Loading profile...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="bg-white pt-16 pb-4 px-6 flex-row items-center justify-between border-b border-gray-100 z-10">
        <Pressable onPress={() => router.back()} className="p-2 -ml-2 bg-gray-50 rounded-full">
          <ArrowLeft size={24} color="#1f2937" />
        </Pressable>
        <Text className="text-xl font-bold text-gray-900">Account Settings</Text>
        <View className="w-10" />
      </View>

      <ScrollView className="flex-1" contentContainerStyle={{ padding: 24, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
        
        {/* Profile Info Section */}
        <View className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 mb-6 items-center">
          <View className="bg-gray-100 p-6 rounded-full mb-4">
            <User size={48} color="#9ca3af" />
          </View>
          <Text className="text-xl font-bold text-gray-900">{profile.first_name} {profile.last_name}</Text>
          <Text className="text-gray-500 text-sm mt-1">{email}</Text>
        </View>

        <View className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <Text className="text-lg font-bold text-gray-900 mb-4">Personal Information</Text>

          {/* First Name Input */}
          <View className="mb-4">
            <Text className="text-sm font-medium text-gray-700 mb-2">First Name</Text>
            <View className="flex-row items-center bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus:border-[#081f3d]">
              <User size={20} color="#9ca3af" className="mr-3" />
              <TextInput
                className="flex-1 text-gray-900 font-medium text-base"
                placeholder="Enter your first name"
                placeholderTextColor="#9ca3af"
                value={profile.first_name}
                onChangeText={(text) => setProfile(prev => ({ ...prev, first_name: text }))}
              />
            </View>
          </View>

          {/* Last Name Input */}
          <View className="mb-4">
            <Text className="text-sm font-medium text-gray-700 mb-2">Last Name</Text>
            <View className="flex-row items-center bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus:border-[#081f3d]">
              <User size={20} color="#9ca3af" className="mr-3" />
              <TextInput
                className="flex-1 text-gray-900 font-medium text-base"
                placeholder="Enter your last name"
                placeholderTextColor="#9ca3af"
                value={profile.last_name}
                onChangeText={(text) => setProfile(prev => ({ ...prev, last_name: text }))}
              />
            </View>
          </View>

          {/* Phone Number Input */}
          <View className="mb-4">
            <Text className="text-sm font-medium text-gray-700 mb-2">Phone Number</Text>
            <View className="flex-row items-center bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus:border-[#081f3d]">
              <Phone size={20} color="#9ca3af" className="mr-3" />
              <TextInput
                className="flex-1 text-gray-900 font-medium text-base"
                placeholder="Enter your phone number"
                placeholderTextColor="#9ca3af"
                keyboardType="phone-pad"
                value={profile.phone_number}
                onChangeText={(text) => setProfile(prev => ({ ...prev, phone_number: text }))}
              />
            </View>
          </View>

          {/* Address Input */}
          <View className="mb-4">
            <Text className="text-sm font-medium text-gray-700 mb-2">Address</Text>
            <View className="flex-row items-center bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus:border-[#081f3d]">
              <MapPin size={20} color="#9ca3af" className="mr-3" />
              <TextInput
                className="flex-1 text-gray-900 font-medium text-base"
                placeholder="Enter your address"
                placeholderTextColor="#9ca3af"
                multiline
                value={profile.address}
                onChangeText={(text) => setProfile(prev => ({ ...prev, address: text }))}
              />
            </View>
          </View>

          {/* 2FA Toggle */}
          <View className="mt-4 pt-4 border-t border-gray-100 flex-row items-center justify-between">
            <View className="flex-1 pr-4">
              <Text className="text-sm font-bold text-gray-900 mb-1">Two-Factor Authentication (2FA)</Text>
              <Text className="text-xs text-gray-500">Add an extra layer of security to your account</Text>
            </View>
            <View>
              {/* @ts-ignore */}
              <Switch
                trackColor={{ false: '#d1d5db', true: '#93c5fd' }}
                thumbColor={profile.mfa_enabled ? '#2563eb' : '#f3f4f6'}
                ios_backgroundColor="#d1d5db"
                onValueChange={(val) => setProfile(prev => ({ ...prev, mfa_enabled: val }))}
                value={profile.mfa_enabled || false}
              />
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Footer / Save Button */}
      <View className="p-6 bg-white border-t border-gray-100 pb-8">
        <Pressable
          onPress={handleSave}
          disabled={saving}
          className={`flex-row items-center justify-center py-4 rounded-xl ${saving ? 'bg-gray-400' : 'bg-[#081f3d]'}`}
        >
          {saving ? (
            <ActivityIndicator color="white" />
          ) : (
            <>
              <Save size={20} color="white" className="mr-2" />
              <Text className="text-white font-bold text-lg">Save Changes</Text>
            </>
          )}
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}
