import React from 'react';
import { View, Text, ViewProps } from 'react-native';
import { twMerge } from 'tailwind-merge';

export function Card({ children, className = '', ...props }: ViewProps & { className?: string }) {
  return (
    <View 
      className={twMerge("bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden", className)}
      {...props}
    >
      {children}
    </View>
  );
}

export function CardHeader({ children, className = '', ...props }: ViewProps & { className?: string }) {
  return (
    <View 
      className={twMerge("px-6 py-5 border-b border-gray-100", className)}
      {...props}
    >
      {children}
    </View>
  );
}

export function CardContent({ children, className = '', ...props }: ViewProps & { className?: string }) {
  return (
    <View 
      className={twMerge("p-6", className)}
      {...props}
    >
      {children}
    </View>
  );
}

export function MetricCard({ title, value, icon, trend, className = '' }: { title: string; value: string | number; icon?: React.ReactNode; trend?: string; className?: string }) {
  return (
    <Card className={twMerge("shadow-sm", className)}>
      <CardContent className="flex-row items-center justify-between">
        <View className="flex-1">
          <Text className="text-sm font-medium text-gray-500">{title}</Text>
          <Text className="text-3xl font-bold text-gray-900 mt-2">{value}</Text>
          {trend && <Text className="text-xs text-green-600 mt-2">{trend}</Text>}
        </View>
        {icon && (
          <View className="h-12 w-12 rounded-xl bg-indigo-50 flex items-center justify-center">
            {icon}
          </View>
        )}
      </CardContent>
    </Card>
  );
}
