import React from 'react';
import { ActivityIndicator, View } from 'react-native';
import { twMerge } from 'tailwind-merge';

interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  color?: string;
}

export function Spinner({ size = 'md', className = '', color = '#4f46e5' }: SpinnerProps) {
  const sizeMap = {
    sm: 'small' as const,
    md: 'small' as const,
    lg: 'large' as const,
  };

  return (
    <View className={twMerge("justify-center items-center", className)}>
      <ActivityIndicator size={sizeMap[size]} color={color} />
    </View>
  );
}
