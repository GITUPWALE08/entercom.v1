import React, { useState, useEffect } from 'react';
import { View, Text, Alert, Image, KeyboardAvoidingView, Platform, ScrollView, Pressable } from 'react-native';
import { Link, router } from 'expo-router';
import { authApi } from '../../src/api/auth';
import { useAuthStore } from '../../src/store/authStore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Input } from '../../src/components/ui/Input';
import { Button } from '../../src/components/ui/Button';
import { Alert as CustomAlert } from '../../src/components/ui/Alert';
import { Fingerprint } from 'lucide-react-native';

// expo-local-authentication is not available on web
const LocalAuthentication = Platform.OS !== 'web'
  ? require('expo-local-authentication')
  : null;

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isBiometricSupported, setIsBiometricSupported] = useState(false);
  
  // MFA state
  const [mfaRequired, setMfaRequired] = useState(false);
  const [mfaSession, setMfaSession] = useState<string | null>(null);
  const [mfaOtp, setMfaOtp] = useState('');
  const [isVerifyingMfa, setIsVerifyingMfa] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const setUser = useAuthStore((state) => state.setUser);

  useEffect(() => {
    if (!LocalAuthentication) return;
    (async () => {
      const compatible = await LocalAuthentication.hasHardwareAsync();
      const enrolled = await LocalAuthentication.isEnrolledAsync();
      setIsBiometricSupported(compatible && enrolled);
    })();
  }, []);

  const handleSuccessfulLogin = async (response: any, emailParam: string, passwordParam: string) => {
    await AsyncStorage.setItem('access_token', response.tokens.access);
    await AsyncStorage.setItem('refresh_token', response.tokens.refresh);
    
    // Store credentials for biometric login (Note: In production use SecureStore)
    await AsyncStorage.setItem('saved_email', emailParam);
    await AsyncStorage.setItem('saved_password', passwordParam);
    
    setUser(response.user);
    router.replace('/(drawer)');
  };

  const handleLogin = async () => {
    setLoginError(null);
    if (!email || !password) {
      setLoginError('Please enter both email and password');
      return;
    }

    try {
      setIsLoading(true);
      const response = await authApi.login({ email, password });
      
      if (response.mfa_required) {
        setMfaRequired(true);
        setMfaSession(response.mfa_session || null);
        return;
      }
      
      await handleSuccessfulLogin(response, email, password);
    } catch (error: any) {
      setLoginError(error?.response?.data?.detail || error?.message || 'Something went wrong');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyMfa = async () => {
    if (!mfaSession || mfaOtp.length !== 6) return;
    try {
      setIsVerifyingMfa(true);
      const response = await authApi.verifyMfa(mfaSession, mfaOtp);
      await handleSuccessfulLogin(response, email, password);
    } catch (error: any) {
      setLoginError(error?.response?.data?.detail || 'Invalid or expired code');
    } finally {
      setIsVerifyingMfa(false);
    }
  };

  const handleResendMfa = async () => {
    setLoginError(null);
    setSuccessMsg(null);
    if (!mfaSession) return;
    try {
      setIsResending(true);
      await authApi.resendMfa(mfaSession);
      setSuccessMsg('A new code has been sent to your email.');
    } catch (error: any) {
      setLoginError(error?.response?.data?.detail || 'Failed to resend code');
    } finally {
      setIsResending(false);
    }
  };

  const handleBiometricLogin = async () => {
    try {
      const savedEmail = await AsyncStorage.getItem('saved_email');
      const savedPassword = await AsyncStorage.getItem('saved_password');
      
      if (!savedEmail || !savedPassword) {
        Alert.alert('No Saved Credentials', 'Please login with email and password first to enable biometric login.');
        return;
      }

      const result = await LocalAuthentication!.authenticateAsync({
        promptMessage: 'Login to Entercom',
        fallbackLabel: 'Use Passcode',
      });

      if (result.success) {
        setIsLoading(true);
        const response = await authApi.login({ email: savedEmail, password: savedPassword });
        if (response.mfa_required) {
          setEmail(savedEmail);
          setPassword(savedPassword);
          setMfaRequired(true);
          setMfaSession(response.mfa_session || null);
        } else {
          await handleSuccessfulLogin(response, savedEmail, savedPassword);
        }
      }
    } catch (error) {
      console.error('Biometric auth error', error);
      setLoginError('Biometric authentication failed');
    } finally {
      setIsLoading(false);
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
            <Text className="text-4xl font-bold text-ess-darkPurple mb-2 tracking-tight text-center">Welcome Back</Text>
            <Text className="text-[15px] font-medium text-gray-500 text-center tracking-wide">
              {mfaRequired ? 'Enter your 2FA verification code' : 'Sign in to manage your security'}
            </Text>
          </View>

          {loginError && (
            <CustomAlert 
              type="error" 
              title="Error" 
              description={loginError} 
              className="mb-6 shadow-sm shadow-red-500/10" 
            />
          )}

          {successMsg && (
            <CustomAlert 
              type="success" 
              title="Success" 
              description={successMsg} 
              className="mb-6 shadow-sm shadow-green-500/10" 
            />
          )}

          {mfaRequired ? (
            <View className="space-y-6">
              <Input
                label="6-Digit Code"
                placeholder="000000"
                keyboardType="number-pad"
                maxLength={6}
                value={mfaOtp}
                onChangeText={setMfaOtp}
                style={{ textAlign: 'center', fontSize: 24, letterSpacing: 8 }}
              />
              <View className="mt-4">
                <Button
                  variant="primary"
                  size="lg"
                  isLoading={isVerifyingMfa}
                  onPress={handleVerifyMfa}
                  className="w-full shadow-lg shadow-ess-purple/20"
                >
                  Verify Code
                </Button>
              </View>
              <Pressable className="mt-2 items-center" onPress={handleResendMfa} disabled={isResending || isVerifyingMfa}>
                <Text className={`text-ess-purple font-medium ${isResending ? 'opacity-50' : ''}`}>
                  {isResending ? 'Sending...' : 'Did not receive code? Resend'}
                </Text>
              </Pressable>
              <Pressable className="mt-6 items-center" onPress={() => setMfaRequired(false)}>
                <Text className="text-gray-500 font-medium">Back to Login</Text>
              </Pressable>
            </View>
          ) : (
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

                <View>
                  <Input
                    label="Password"
                    placeholder="Enter your password"
                    secureTextEntry
                    value={password}
                    onChangeText={setPassword}
                  />
                  <View className="flex-row justify-end mt-3">
                    <Link href="/(auth)/forgot-password" asChild>
                      <Text className="text-[13px] font-bold text-ess-purple tracking-wide">Forgot your password?</Text>
                    </Link>
                  </View>
                </View>
              </View>

              <View className="mt-10 space-y-4">
                <Button
                  variant="primary"
                  size="lg"
                  isLoading={isLoading}
                  onPress={handleLogin}
                  className="w-full shadow-lg shadow-ess-purple/20"
                >
                  Sign In
                </Button>

                {isBiometricSupported && (
                  <Button
                    variant="outline"
                    size="lg"
                    onPress={handleBiometricLogin}
                    disabled={isLoading}
                    className="w-full border-gray-200"
                  >
                    <View className="flex-row items-center justify-center space-x-2">
                      <Fingerprint size={20} color="#081f3d" className="mr-2" />
                      <Text className="text-gray-900 font-bold">Login with Biometrics</Text>
                    </View>
                  </Button>
                )}
              </View>

              <View className="mt-8 flex-row justify-center items-center">
                <Text className="text-gray-500 font-medium tracking-wide">New to Entercom? </Text>
                <Link href="/(auth)/register" asChild>
                  <Text className="text-ess-purple font-bold tracking-wide">Create an account</Text>
                </Link>
              </View>
            </>
          )}
          
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
