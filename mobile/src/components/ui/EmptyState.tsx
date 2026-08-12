import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <View className="flex-1 items-center justify-center py-16 px-6" style={styles.container}>
      {icon && (
        <View style={styles.iconContainer} className="mb-6 items-center justify-center rounded-[32px] bg-[#f5f3ff] border border-[#ede9fe] shadow-sm">
          {icon}
        </View>
      )}
      
      <Text className="text-[22px] font-extrabold text-gray-900 tracking-tight text-center mb-3">
        {title}
      </Text>
      
      {description ? (
        <Text className="text-base text-gray-500 text-center leading-relaxed max-w-[300px]">
          {description}
        </Text>
      ) : null}
      
      {action && (
        <View className="mt-8 w-full items-center">
          {action}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    minHeight: 300,
  },
  iconContainer: {
    width: 96,
    height: 96,
  }
});
