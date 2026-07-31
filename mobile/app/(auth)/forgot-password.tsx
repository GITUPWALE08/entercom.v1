import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, ActivityIndicator, Alert, Image } from 'react-native';
import { Link, router } from 'expo-router';
import { authApi } from '../../src/api/auth';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Mail } from 'lucide-react-native';

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleResetPassword = async () => {
    if (!email) {
      Alert.alert('Error', 'Please enter your email address');
      return;
    }

    try {
      setIsLoading(true);
      await authApi.requestPasswordReset(email);
      setIsSuccess(true);
    } catch (error: any) {
      Alert.alert('Request Failed', error?.message || 'Something went wrong');
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
                source={require('../../assets/icon.png')} 
                style={{ width: 40, height: 40, resizeMode: 'contain' }} 
              />
            </View>
          </View>
          <Text className="mt-2 text-center text-sm text-gray-600 mb-6">
            Entercom Security Systems Portal
          </Text>
          <Text className="text-4xl font-bold text-gray-900 mb-2">Reset Password</Text>
          <Text className="text-lg text-gray-500">
            {isSuccess ? "Check your email for reset instructions." : "Enter your email to receive a reset link."}
          </Text>
        </View>

        {!isSuccess ? (
          <>
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
            </View>

            <View className="mt-8">
              <Pressable
                onPress={handleResetPassword}
                disabled={isLoading}
                className={`h-14 rounded-2xl items-center justify-center ${isLoading ? 'bg-indigo-400' : 'bg-indigo-600'} active:bg-indigo-700 shadow-sm`}
              >
                {isLoading ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text className="text-white text-lg font-semibold">Send Reset Link</Text>
                )}
              </Pressable>
            </View>
          </>
        ) : (
          <View className="mt-4">
            <Pressable
              onPress={() => router.replace('/login')}
              className="h-14 rounded-2xl items-center justify-center bg-indigo-600 active:bg-indigo-700 shadow-sm"
            >
              <Text className="text-white text-lg font-semibold">Return to Login</Text>
            </Pressable>
          </View>
        )}

        <View className="mt-6 flex-row justify-center">
          <Link href="/login" asChild>
            <Pressable>
              <Text className="text-indigo-600 font-semibold">Back to Sign In</Text>
            </Pressable>
          </Link>
        </View>
      </View>
    </SafeAreaView>
  );
}
