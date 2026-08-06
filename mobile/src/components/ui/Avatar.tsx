import React from 'react';
import { View, Text, Image, ImageSourcePropType } from 'react-native';
import { twMerge } from 'tailwind-merge';

export type AvatarSize = 'sm' | 'md' | 'lg' | 'xl';

export interface AvatarProps {
  src?: string | ImageSourcePropType;
  fallback?: string;
  size?: AvatarSize;
  className?: string;
  status?: 'online' | 'offline' | 'away' | 'busy';
}

export const Avatar: React.FC<AvatarProps> = ({ src, fallback, size = 'md', className = '', status }) => {
  const sizes: Record<AvatarSize, string> = {
    sm: 'w-8 h-8 rounded-full',
    md: 'w-12 h-12 rounded-full',
    lg: 'w-16 h-16 rounded-[24px]',
    xl: 'w-24 h-24 rounded-[32px]',
  };

  const textSizes: Record<AvatarSize, string> = {
    sm: 'text-xs',
    md: 'text-base',
    lg: 'text-xl',
    xl: 'text-3xl',
  };
  
  const statusColors = {
    online: 'bg-ess-green',
    offline: 'bg-gray-400',
    away: 'bg-ess-orange',
    busy: 'bg-red-500',
  };

  const statusSize = size === 'sm' ? 'w-2 h-2' : size === 'md' ? 'w-3 h-3' : size === 'lg' ? 'w-4 h-4' : 'w-5 h-5';
  const statusPosition = size === 'sm' || size === 'md' ? '-bottom-0.5 -right-0.5' : '-bottom-1 -right-1';

  return (
    <View className="relative">
      <View className={twMerge("bg-ess-softBlue items-center justify-center overflow-hidden border border-ess-purple/10", sizes[size], className)}>
        {src ? (
          <Image 
            source={typeof src === 'string' ? { uri: src } : src} 
            className="w-full h-full"
            resizeMode="cover"
          />
        ) : (
          <Text className={twMerge("font-bold text-ess-darkPurple uppercase", textSizes[size])}>
            {fallback?.substring(0, 2) || 'US'}
          </Text>
        )}
      </View>
      
      {status && (
        <View 
          className={twMerge(
            "absolute rounded-full border-2 border-white",
            statusSize,
            statusColors[status],
            statusPosition
          )} 
        />
      )}
    </View>
  );
};
