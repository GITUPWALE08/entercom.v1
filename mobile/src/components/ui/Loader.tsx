import React, { useEffect, useRef } from 'react';
import { View, Animated, Easing, Text } from 'react-native';

export function LogoLoader({ text = 'Loading...' }: { text?: string }) {
  const pulseAnim = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0.8,
          duration: 800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [pulseAnim]);

  return (
    <View className="flex-1 items-center justify-center bg-gray-50">
      <Animated.Image 
        source={require('../../../assets/logo.png')} 
        style={{ transform: [{ scale: pulseAnim }], width: 64, height: 64 }} 
        resizeMode="contain"
      />
      <Text className="text-ess-purple mt-6 font-semibold tracking-wide text-[15px]">{text}</Text>
    </View>
  );
}
