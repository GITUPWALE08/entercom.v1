import React from 'react';
import { View, TextInput, TextInputProps } from 'react-native';
import { Search } from 'lucide-react-native';
import { twMerge } from 'tailwind-merge';

export interface SearchInputProps extends Omit<TextInputProps, 'className'> {
  className?: string;
}

export function SearchInput({ className = '', ...props }: SearchInputProps) {
  return (
    <View className={twMerge("relative justify-center", className)}>
      <View className="absolute left-3 z-10">
        <Search color="#9ca3af" size={16} />
      </View>
      <TextInput
        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:border-indigo-600 text-sm text-gray-900"
        placeholderTextColor="#9ca3af"
        placeholder="Search..."
        {...props}
      />
    </View>
  );
}
