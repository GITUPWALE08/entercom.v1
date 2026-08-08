import React, { useState } from 'react';
import { View, Text, Alert, Image, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { Link, router } from 'expo-router';
import { authApi } from '../../src/api/auth';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Input } from '../../src/components/ui/Input';
import { Button } from '../../src/components/ui/Button';

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [isResetting, setIsResetting] = useState(false);

  const handleRequestOtp = async () => {
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

  const handleCompleteReset = async () => {
    if (!otp || !newPassword) {
      Alert.alert('Error', 'Please enter the OTP and a new password');
      return;
    }

    try {
      setIsResetting(true);
      await authApi.resetPassword({ email, token: otp, new_password: newPassword });
      Alert.alert('Success', 'Your password has been reset successfully. You can now login.', [
        { text: 'OK', onPress: () => router.replace('/(auth)/login') }
      ]);
    } catch (error: any) {
      Alert.alert('Reset Failed', error?.message || 'Invalid or expired OTP');
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white relative">
      {/* Premium Background Elements */}
      <View className="absolute top-0 left-0 w-full h-[300px] bg-ess-softBlue rounded-b-[60px]" />
      <View className="absolute -top-32 -right-32 w-96 h-96 bg-ess-purple rounded-full opacity-5 blur-[100px]" />
      <View className="absolute top-40 -left-20 w-72 h-72 bg-ess-green rounded-full opacity-5 blur-[80px]" />

      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
        className="flex-1"
      >
        <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', paddingHorizontal: 32 }} showsVerticalScrollIndicator={false}>
          
          <View className="mb-12 items-center">
            <View className="w-16 h-16 bg-white rounded-[20px] items-center justify-center shadow-lg shadow-black/5 border border-ess-purple/5 mb-6">
              <Image 
                source={require('../../assets/logo.png')} 
                style={{ width: 44, height: 44, resizeMode: 'contain' }} 
                defaultSource={require('../../assets/logo.png')}
              />
            </View>
            <Text className="text-4xl font-bold text-ess-darkPurple mb-2 tracking-tight text-center">Reset Password</Text>
            <Text className="text-[15px] font-medium text-gray-500 text-center tracking-wide px-4">
              {isSuccess ? "Check your email for reset instructions." : "Enter your email to receive a reset link."}
            </Text>
          </View>

          {!isSuccess ? (
            <>
              <View className="space-y-6">
                <Input
                  label="Email Address"
                  placeholder="name@example.com"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  value={email}
                  onChangeText={setEmail}
                />
              </View>

              <View className="mt-10">
                <Button
                  variant="primary"
                  size="lg"
                  isLoading={isLoading}
                  onPress={handleRequestOtp}
                  className="w-full shadow-lg shadow-ess-purple/20"
                >
                  Send Reset Code
                </Button>
              </View>
            </>
          ) : (
            <View className="space-y-6">
              <Input
                label="6-Digit Reset Code (OTP)"
                placeholder="000000"
                keyboardType="number-pad"
                value={otp}
                onChangeText={setOtp}
              />
              <Input
                label="New Password"
                placeholder="••••••••"
                secureTextEntry
                value={newPassword}
                onChangeText={setNewPassword}
              />
              <View className="mt-4">
                <Button
                  variant="primary"
                  size="lg"
                  isLoading={isResetting}
                  onPress={handleCompleteReset}
                  className="w-full shadow-lg shadow-ess-purple/20"
                >
                  Reset Password
                </Button>
              </View>
            </View>
          )}

          <View className="mt-8 flex-row justify-center items-center">
            <Link href="/(auth)/login" asChild>
              <Text className="text-ess-purple font-bold tracking-wide">Back to Sign In</Text>
            </Link>
          </View>
          
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
