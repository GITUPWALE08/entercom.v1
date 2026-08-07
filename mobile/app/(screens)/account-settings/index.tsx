import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, ScrollView, Pressable, ActivityIndicator, Alert, KeyboardAvoidingView, Platform, Switch, Image } from 'react-native';
import { router } from 'expo-router';
import { ArrowLeft, User, Phone, MapPin, Save, Camera } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import { decode } from 'base64-arraybuffer';
import { supabase } from '../../../src/lib/supabase';
import { usersApi, User as UserType } from '../../../src/api/users';

export default function AccountSettingsScreen() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<Partial<UserType>>({
    first_name: '',
    last_name: '',
    phone_number: '',
    address: '',
    profile_image: '',
  });
  const [email, setEmail] = useState('');
  const [showPasswordSection, setShowPasswordSection] = useState(false);
  const [passwords, setPasswords] = useState({ old_password: '', new_password: '', confirm_password: '' });
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

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
        profile_image: data.profile_image || '',
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
        profile_image: profile.profile_image,
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

  const handlePickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setUploadingImage(true);
        const asset = result.assets[0];
        const fileUri = asset.uri;
        const fileName = `avatar_${Date.now()}.jpg`;
        
        const base64 = await FileSystem.readAsStringAsync(fileUri, { encoding: 'base64' });
        const filePath = `avatars/${fileName}`;
        
        const { error: uploadError } = await supabase.storage
          .from('entercom-media')
          .upload(filePath, decode(base64), { contentType: 'image/jpeg' });
          
        if (uploadError) throw uploadError;
        
        const { data: publicUrlData } = supabase.storage
          .from('entercom-media')
          .getPublicUrl(filePath);
          
        setProfile(prev => ({ ...prev, profile_image: publicUrlData.publicUrl }));
      }
    } catch (error) {
      console.error('Error uploading image', error);
      Alert.alert('Error', 'Could not upload profile picture.');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleChangePassword = async () => {
    if (passwords.new_password !== passwords.confirm_password) {
      Alert.alert('Error', 'New passwords do not match.');
      return;
    }
    if (!passwords.old_password || !passwords.new_password) {
      Alert.alert('Error', 'Please fill in all password fields.');
      return;
    }
    
    try {
      setPasswordLoading(true);
      const { authApi } = await import('../../../src/api/auth');
      // Verify current password via login first if needed by API logic, but usually change-password route handles it.
      // Wait, web portal does authApi.login first. We will just hit change-password directly and let it fail if invalid.
      const { apiClient } = await import('../../../src/api/axios');
      await apiClient.post('/auth/change-password/', { 
        old_password: passwords.old_password, 
        new_password: passwords.new_password 
      });
      Alert.alert('Success', 'Password changed successfully.');
      setShowPasswordSection(false);
      setPasswords({ old_password: '', new_password: '', confirm_password: '' });
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.detail || 'Failed to change password.');
    } finally {
      setPasswordLoading(false);
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
          <Pressable onPress={handlePickImage} className="relative mb-4">
            {profile.profile_image ? (
              <Image source={{ uri: profile.profile_image }} className="w-24 h-24 rounded-full bg-gray-100" />
            ) : (
              <View className="bg-gray-100 rounded-full w-24 h-24 items-center justify-center">
                <User size={40} color="#9ca3af" />
              </View>
            )}
            {uploadingImage && (
              <View className="absolute inset-0 bg-black/30 rounded-full items-center justify-center">
                <ActivityIndicator color="white" />
              </View>
            )}
            <View className="absolute bottom-0 right-0 bg-ess-purple p-2 rounded-full border-2 border-white shadow-sm">
              <Camera size={14} color="white" />
            </View>
          </Pressable>
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
                onValueChange={(val: boolean) => setProfile(prev => ({ ...prev, mfa_enabled: val }))}
                value={profile.mfa_enabled || false}
              />
            </View>
          </View>
        </View>

        {/* Change Password Section */}
        <View className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 mt-6">
          <View className="flex-row items-center justify-between mb-4">
            <Text className="text-lg font-bold text-gray-900">Security</Text>
            <Pressable onPress={() => setShowPasswordSection(!showPasswordSection)}>
              <Text className="text-[#081f3d] font-bold text-sm">
                {showPasswordSection ? 'Cancel' : 'Change Password'}
              </Text>
            </Pressable>
          </View>
          
          {showPasswordSection && (
            <View className="space-y-4 pt-4 border-t border-gray-100">
              <View className="mb-4">
                <Text className="text-sm font-medium text-gray-700 mb-2">Current Password</Text>
                <TextInput
                  secureTextEntry
                  className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-900 font-medium"
                  placeholder="Enter current password"
                  value={passwords.old_password}
                  onChangeText={(t) => setPasswords(p => ({ ...p, old_password: t }))}
                />
              </View>
              <View className="mb-4">
                <Text className="text-sm font-medium text-gray-700 mb-2">New Password</Text>
                <TextInput
                  secureTextEntry
                  className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-900 font-medium"
                  placeholder="Enter new password"
                  value={passwords.new_password}
                  onChangeText={(t) => setPasswords(p => ({ ...p, new_password: t }))}
                />
              </View>
              <View className="mb-4">
                <Text className="text-sm font-medium text-gray-700 mb-2">Confirm New Password</Text>
                <TextInput
                  secureTextEntry
                  className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-900 font-medium"
                  placeholder="Confirm new password"
                  value={passwords.confirm_password}
                  onChangeText={(t) => setPasswords(p => ({ ...p, confirm_password: t }))}
                />
              </View>
              <Pressable 
                onPress={handleChangePassword}
                disabled={passwordLoading}
                className={`py-3 rounded-xl items-center mt-2 ${passwordLoading ? 'bg-gray-400' : 'bg-ess-purple'}`}
              >
                {passwordLoading ? <ActivityIndicator color="white" /> : <Text className="text-white font-bold">Update Password</Text>}
              </Pressable>
            </View>
          )}
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
