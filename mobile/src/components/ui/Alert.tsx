import React from 'react';
import { View, Text } from 'react-native';
import { AlertCircle, CheckCircle, Info } from 'lucide-react-native';
import { twMerge } from 'tailwind-merge';

interface AlertProps {
  title: string;
  description?: React.ReactNode;
  type?: 'info' | 'success' | 'error' | 'warning';
  className?: string;
}

export function Alert({ title, description, type = 'info', className = '' }: AlertProps) {
  const styles = {
    info: 'bg-blue-50 border-blue-100',
    success: 'bg-green-50 border-green-100',
    error: 'bg-red-50 border-red-100',
    warning: 'bg-yellow-50 border-yellow-100',
  };
  
  const textStyles = {
    info: 'text-blue-800',
    success: 'text-green-800',
    error: 'text-red-800',
    warning: 'text-yellow-800',
  };

  const icons = {
    info: <Info size={20} color="#3b82f6" />,
    success: <CheckCircle size={20} color="#22c55e" />,
    error: <AlertCircle size={20} color="#ef4444" />,
    warning: <AlertCircle size={20} color="#eab308" />,
  };

  return (
    <View className={twMerge(`flex-row gap-3 p-4 rounded-xl border`, styles[type], className)}>
      <View className="shrink-0 mt-0.5">{icons[type]}</View>
      <View className="flex-1">
        <Text className={twMerge("font-bold text-sm", textStyles[type])}>{title}</Text>
        {description && (
          typeof description === 'string' ? 
            <Text className={twMerge("text-sm opacity-90 mt-1", textStyles[type])}>{description}</Text> : 
            description
        )}
      </View>
    </View>
  );
}
