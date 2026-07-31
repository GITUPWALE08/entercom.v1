import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, ActivityIndicator, Alert, ScrollView, Image } from 'react-native';
import { Link, router } from 'expo-router';
import { authApi } from '../../src/api/auth';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Mail, Lock, User as UserIcon, Phone } from 'lucide-react-native';

export default function RegisterScreen() {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleRegister = async () => {
    if (!email || !password || !firstName || !lastName) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    try {
      setIsLoading(true);
      const payload: Record<string, string> = { email, password, first_name: firstName, last_name: lastName };
      if (phone) payload.phone_number = phone;
      await authApi.register(payload);
      Alert.alert('Success', 'Registration successful. Please login.', [
        { text: 'OK', onPress: () => router.replace('/login') }
      ]);
    } catch (error: any) {
      Alert.alert('Registration Failed', error?.message || 'Something went wrong');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }} showsVerticalScrollIndicator={false}>
        <View className="px-6 py-8">
          <View className="mb-10">
            <View className="flex-row justify-center mb-4">
              <View className="w-12 h-12 bg-blue-900 rounded-lg items-center justify-center">
                <Image 
                  source={require('../../assets/logo.png')} 
                  style={{ width: 40, height: 40, resizeMode: 'contain' }} 
                />
              </View>
            </View>
            <Text className="mt-2 text-center text-sm text-gray-600 mb-6">
              Entercom Security Systems Portal
            </Text>
            <Text className="text-4xl font-bold text-gray-900 mb-2">Create Account</Text>
            <Text className="text-lg text-gray-500">Sign up to get started</Text>
          </View>

          <View className="space-y-4">
            <View>
              <Text className="text-sm font-medium text-gray-700 mb-1 ml-1">First Name</Text>
              <View className="flex-row items-center bg-gray-50 border border-gray-200 rounded-2xl px-4 h-14">
                <UserIcon color="#9CA3AF" size={20} />
                <TextInput
                  className="flex-1 ml-3 text-base text-gray-900"
                  placeholder="Enter your first name"
                  placeholderTextColor="#9CA3AF"
                  value={firstName}
                  onChangeText={setFirstName}
                />
              </View>
            </View>

            <View>
              <Text className="text-sm font-medium text-gray-700 mb-1 ml-1">Last Name</Text>
              <View className="flex-row items-center bg-gray-50 border border-gray-200 rounded-2xl px-4 h-14">
                <UserIcon color="#9CA3AF" size={20} />
                <TextInput
                  className="flex-1 ml-3 text-base text-gray-900"
                  placeholder="Enter your last name"
                  placeholderTextColor="#9CA3AF"
                  value={lastName}
                  onChangeText={setLastName}
                />
              </View>
            </View>

            <View>
              <Text className="text-sm font-medium text-gray-700 mb-1 ml-1">Phone Number (Optional)</Text>
              <View className="flex-row items-center bg-gray-50 border border-gray-200 rounded-2xl px-4 h-14">
                <Phone color="#9CA3AF" size={20} />
                <TextInput
                  className="flex-1 ml-3 text-base text-gray-900"
                  placeholder="Enter your phone number"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="phone-pad"
                  value={phone}
                  onChangeText={setPhone}
                />
              </View>
            </View>

            <View>
              <Text className="text-sm font-medium text-gray-700 mb-1 ml-1">Email</Text>
              <View className="flex-row items-center bg-gray-50 border border-gray-200 rounded-2xl px-4 h-14">
                <Mail color="#9CA3AF" size={20} />
                <TextInput
                  className="flex-1 ml-3 text-base text-gray-900"
                  placeholder="Enter your email"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  value={email}
                  onChangeText={setEmail}
                />
              </View>
            </View>

            <View>
              <Text className="text-sm font-medium text-gray-700 mb-1 ml-1">Password</Text>
              <View className="flex-row items-center bg-gray-50 border border-gray-200 rounded-2xl px-4 h-14">
                <Lock color="#9CA3AF" size={20} />
                <TextInput
                  className="flex-1 ml-3 text-base text-gray-900"
                  placeholder="Create a password"
                  placeholderTextColor="#9CA3AF"
                  secureTextEntry
                  value={password}
                  onChangeText={setPassword}
                />
              </View>
            </View>
          </View>

          <View className="mt-8">
            <Pressable
              onPress={handleRegister}
              disabled={isLoading}
              className={`h-14 rounded-2xl items-center justify-center ${isLoading ? 'bg-indigo-400' : 'bg-indigo-600'} active:bg-indigo-700 shadow-sm`}
            >
              {isLoading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text className="text-white text-lg font-semibold">Sign Up</Text>
              )}
            </Pressable>
          </View>

          <View className="mt-6 flex-row justify-center">
            <Text className="text-gray-500">Already have an account? </Text>
            <Link href="/login" asChild>
              <Pressable>
                <Text className="text-indigo-600 font-semibold">Sign In</Text>
              </Pressable>
            </Link>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
