import React, { forwardRef } from 'react';
import { TextInput, Text, View, TextInputProps } from 'react-native';
import { twMerge } from 'tailwind-merge';

export interface InputProps extends Omit<TextInputProps, 'className'> {
  label?: string;
  error?: string;
  className?: string;
  containerClassName?: string;
}

export const Input = forwardRef<TextInput, InputProps>(({ label, error, className = '', containerClassName = '', ...props }, ref) => (
  <View className={twMerge("flex-col gap-1.5 w-full", containerClassName)}>
    {label && <Text className="text-sm font-semibold text-gray-700">{label}</Text>}
    <TextInput
      ref={ref}
      className={twMerge(
        "w-full px-4 py-2.5 rounded-xl border bg-gray-50 focus:bg-white text-gray-900",
        error ? "border-red-300 focus:border-red-500" : "border-gray-200 focus:border-indigo-600",
        props.editable === false ? "bg-gray-100 text-gray-500" : "",
        className
      )}
      placeholderTextColor="#9ca3af"
      {...props}
    />
    {error && <Text className="text-xs text-red-500 font-medium">{error}</Text>}
  </View>
));

Input.displayName = 'Input';
