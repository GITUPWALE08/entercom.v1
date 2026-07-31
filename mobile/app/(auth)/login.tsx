import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, ActivityIndicator, Alert, Image } from 'react-native';
import { Link } from 'expo-router';
import { authApi } from '../../src/api/auth';
import { useAuthStore } from '../../src/store/authStore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Mail, Lock } from 'lucide-react-native';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const setUser = useAuthStore((state) => state.setUser);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please enter both email and password');
      return;
    }

    try {
      setIsLoading(true);
      const response = await authApi.login({ email, password });
      
      await AsyncStorage.setItem('access_token', response.tokens.access);
      await AsyncStorage.setItem('refresh_token', response.tokens.refresh);
      
      setUser(response.user);
    } catch (error: any) {
      Alert.alert('Login Failed', error?.message || 'Something went wrong');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-1 justify-center px-6">
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
          <Text className="text-4xl font-bold text-gray-900 mb-2">Welcome Back</Text>
          <Text className="text-lg text-gray-500">Sign in to continue</Text>
        </View>

        <View className="space-y-4">
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
                placeholder="Enter your password"
                placeholderTextColor="#9CA3AF"
                secureTextEntry
                value={password}
                onChangeText={setPassword}
              />
            </View>
            <View className="flex-row justify-end mt-2">
              <Link href="/forgot-password" asChild>
                <Pressable>
                  <Text className="text-sm font-medium text-indigo-600">Forgot your password?</Text>
                </Pressable>
              </Link>
            </View>
          </View>
        </View>

        <View className="mt-8">
          <Pressable
            onPress={handleLogin}
            disabled={isLoading}
            className={`h-14 rounded-2xl items-center justify-center ${isLoading ? 'bg-indigo-400' : 'bg-indigo-600'} active:bg-indigo-700 shadow-sm`}
          >
            {isLoading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text className="text-white text-lg font-semibold">Sign In</Text>
            )}
          </Pressable>
        </View>

        <View className="mt-6 flex-row justify-center">
          <Text className="text-gray-500">Don't have an account? </Text>
          <Link href="/register" asChild>
            <Pressable>
              <Text className="text-indigo-600 font-semibold">Sign Up</Text>
            </Pressable>
          </Link>
        </View>
      </View>
    </SafeAreaView>
  );
}
