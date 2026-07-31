import React from 'react';
import { View, Text, Pressable, PressableProps } from 'react-native';
import { ChevronDown } from 'lucide-react-native';
import { twMerge } from 'tailwind-merge';

export interface SelectProps extends Omit<PressableProps, 'className'> {
  label?: string;
  error?: string;
  value?: string | number;
  placeholder?: string;
  options: { label: string; value: string | number }[];
  className?: string;
  containerClassName?: string;
}

export const Select = React.forwardRef<View, SelectProps>(
  ({ label, error, value, placeholder = 'Select an option', options, className = '', containerClassName = '', disabled, ...props }, ref) => {
    const selectedOption = options.find((opt) => opt.value === value);
    
    return (
      <View className={twMerge("flex-col gap-1.5 w-full", containerClassName)}>
        {label && <Text className="text-sm font-semibold text-gray-700">{label}</Text>}
        
        <Pressable
          ref={ref}
          disabled={disabled}
          className={twMerge(
            "w-full px-4 py-3 flex-row items-center justify-between rounded-xl border bg-gray-50",
            error ? "border-red-300" : "border-gray-200",
            disabled ? "bg-gray-100 opacity-50" : "",
            className
          )}
          {...props}
        >
          <Text className={selectedOption ? "text-gray-900" : "text-gray-400"}>
            {selectedOption ? selectedOption.label : placeholder}
          </Text>
          <ChevronDown size={18} color="#6b7280" />
        </Pressable>
        
        {error && <Text className="text-xs text-red-500 font-medium">{error}</Text>}
      </View>
    );
  }
);

Select.displayName = 'Select';
