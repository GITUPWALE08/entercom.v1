import React, { useEffect, useRef } from 'react';
import { Animated, View, ViewStyle } from 'react-native';
import { twMerge } from 'tailwind-merge';

export function Skeleton({ className, style }: { className?: string, style?: ViewStyle }) {
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 0.7, duration: 800, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.3, duration: 800, useNativeDriver: true })
      ])
    ).start();
  }, [opacity]);

  return (
    <Animated.View 
      className={twMerge("bg-gray-200 rounded-md", className)} 
      style={[{ opacity }, style]} 
    />
  );
}

// Specific List Skeletons

export function ListSkeleton() {
  return (
    <View className="px-6 pb-4 space-y-4 pt-4">
      {[1, 2, 3, 4, 5].map(i => (
        <View key={i} className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 mb-4">
           <View className="flex-row justify-between mb-4">
             <View>
               <Skeleton className="w-24 h-6 mb-2" />
               <Skeleton className="w-20 h-4" />
             </View>
             <Skeleton className="w-24 h-8 rounded-full" />
           </View>
           <View className="flex-row justify-between pt-3 border-t border-gray-50 mt-1">
             <View>
               <Skeleton className="w-12 h-4 mb-2" />
               <Skeleton className="w-16 h-5" />
             </View>
             <View>
               <Skeleton className="w-12 h-4 mb-2" />
               <Skeleton className="w-8 h-5" />
             </View>
           </View>
        </View>
      ))}
    </View>
  );
}
