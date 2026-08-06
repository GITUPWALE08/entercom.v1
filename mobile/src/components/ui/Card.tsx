import React from 'react';
import { View, Text, ViewProps } from 'react-native';
import { twMerge } from 'tailwind-merge';

export function Card({ children, className = '', ...props }: ViewProps & { className?: string }) {
  return (
    <View 
      className={twMerge("bg-white rounded-[28px] shadow-lg shadow-black/5 border border-ess-purple/5 overflow-hidden", className)}
      {...props}
    >
      {children}
    </View>
  );
}

export function CardHeader({ children, className = '', ...props }: ViewProps & { className?: string }) {
  return (
    <View 
      className={twMerge("px-7 py-6 border-b border-ess-purple/5", className)}
      {...props}
    >
      {children}
    </View>
  );
}

export function CardContent({ children, className = '', ...props }: ViewProps & { className?: string }) {
  return (
    <View 
      className={twMerge("p-7", className)}
      {...props}
    >
      {children}
    </View>
  );
}

export function MetricCard({ title, value, icon, trend, className = '' }: { title: string; value: string | number; icon?: React.ReactNode; trend?: string; className?: string }) {
  return (
    <Card className={twMerge("shadow-md shadow-ess-purple/5", className)}>
      <CardContent className="flex-row items-center justify-between">
        <View className="flex-1">
          <Text className="text-sm font-semibold tracking-wide text-gray-500 uppercase">{title}</Text>
          <Text className="text-4xl font-bold text-ess-purple mt-1 tracking-tight">{value}</Text>
          {trend && <Text className="text-xs font-semibold text-ess-green mt-2">{trend}</Text>}
        </View>
        {icon && (
          <View className="h-14 w-14 rounded-[20px] bg-ess-softBlue flex items-center justify-center border border-ess-purple/5">
            {icon}
          </View>
        )}
      </CardContent>
    </Card>
  );
}
