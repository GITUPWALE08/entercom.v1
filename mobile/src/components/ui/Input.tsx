import React, { forwardRef, useState } from 'react';
import { TextInput, Text, View, TextInputProps } from 'react-native';
import { twMerge } from 'tailwind-merge';

export interface InputProps extends Omit<TextInputProps, 'className'> {
  label?: string;
  error?: string;
  className?: string;
  containerClassName?: string;
}

export const Input = forwardRef<TextInput, InputProps>(({ label, error, className = '', containerClassName = '', onFocus, onBlur, ...props }, ref) => {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <View className={twMerge("flex-col gap-2 w-full", containerClassName)}>
      {label && <Text className="text-[13px] font-bold tracking-wider text-ess-darkPurple uppercase ml-1">{label}</Text>}
      <TextInput
        ref={ref}
        onFocus={(e) => {
          setIsFocused(true);
          if (onFocus) onFocus(e);
        }}
        onBlur={(e) => {
          setIsFocused(false);
          if (onBlur) onBlur(e);
        }}
        className={twMerge(
          "w-full px-5 py-4 rounded-[20px] bg-white border-2 text-ess-purple font-medium text-base shadow-sm shadow-black/5",
          error 
            ? "border-red-400 bg-red-50" 
            : isFocused 
              ? "border-ess-purple/30 bg-ess-softBlue" 
              : "border-ess-purple/10",
          props.editable === false ? "bg-gray-100 text-gray-400 border-transparent" : "",
          className
        )}
        placeholderTextColor="#9ca3af"
        {...props}
      />
      {error && <Text className="text-[13px] text-red-500 font-semibold ml-1">{error}</Text>}
    </View>
  );
});

Input.displayName = 'Input';
