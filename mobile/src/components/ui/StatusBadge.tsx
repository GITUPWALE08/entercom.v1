import React from 'react';
import { View, Text } from 'react-native';
import { twMerge } from 'tailwind-merge';

interface StatusBadgeProps {
  status?: string;
  className?: string;
}

export function StatusBadge({ status = 'unknown', className = '' }: StatusBadgeProps) {
  const getStatusStyle = (status: string) => {
    switch (status?.toLowerCase() || 'unknown') {
      case 'pending': return { view: 'bg-yellow-50 border-yellow-200', text: 'text-yellow-700' };
      case 'approved':
      case 'completed': return { view: 'bg-green-50 border-green-200', text: 'text-green-700' };
      case 'rejected':
      case 'cancelled': return { view: 'bg-red-50 border-red-200', text: 'text-red-700' };
      case 'in_progress': return { view: 'bg-blue-50 border-blue-200', text: 'text-blue-700' };
      default: return { view: 'bg-gray-50 border-gray-200', text: 'text-gray-700' };
    }
  };

  const styles = getStatusStyle(status);

  return (
    <View className={twMerge(`px-2.5 py-1 rounded-full border self-start`, styles.view, className)}>
      <Text className={twMerge(`text-xs font-bold uppercase tracking-wider`, styles.text)}>
        {status?.replace('_', ' ') || 'UNKNOWN'}
      </Text>
    </View>
  );
}
