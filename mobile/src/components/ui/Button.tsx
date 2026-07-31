import React, { forwardRef } from 'react';
import { Pressable, Text, View, ActivityIndicator, PressableProps } from 'react-native';
import { twMerge } from 'tailwind-merge';

export type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'outline' | 'ghost' | 'link';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends Omit<PressableProps, 'className'> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
  textClassName?: string;
}

export const Button = forwardRef<View, ButtonProps>(
  ({ className = '', textClassName = '', variant = 'primary', size = 'md', isLoading = false, leftIcon, rightIcon, children, disabled, ...props }, ref) => {
    const baseStyles = 'flex-row items-center justify-center rounded-xl';
    
    const variants: Record<ButtonVariant, string> = {
      primary: 'bg-indigo-600',
      secondary: 'bg-gray-100',
      danger: 'bg-red-600',
      outline: 'border-2 border-gray-200 bg-transparent',
      ghost: 'bg-transparent',
      link: 'bg-transparent p-0 h-auto',
    };

    const sizes: Record<ButtonSize, string> = {
      sm: 'h-9 px-4 gap-1.5',
      md: 'h-11 px-6 gap-2',
      lg: 'h-14 px-8 gap-2.5',
    };

    const textVariants: Record<ButtonVariant, string> = {
      primary: 'text-white font-medium',
      secondary: 'text-gray-900 font-medium',
      danger: 'text-white font-medium',
      outline: 'text-gray-700 font-medium',
      ghost: 'text-gray-700 font-medium',
      link: 'text-indigo-600 font-medium underline',
    };

    const textSizes: Record<ButtonSize, string> = {
      sm: 'text-sm',
      md: 'text-sm',
      lg: 'text-base',
    };

    return (
      <Pressable
        ref={ref}
        disabled={disabled || isLoading}
        className={twMerge(
          baseStyles,
          variants[variant],
          variant !== 'link' ? sizes[size] : '',
          (disabled || isLoading) ? 'opacity-50' : '',
          className
        )}
        style={({ pressed }) => [
          { opacity: pressed ? 0.8 : 1 }
        ]}
        {...props}
      >
        {isLoading && (
          <ActivityIndicator 
            color={variant === 'outline' || variant === 'ghost' || variant === 'secondary' ? '#374151' : '#FFFFFF'} 
            size="small" 
            className="mr-2"
          />
        )}
        {!isLoading && leftIcon && <View className="mr-2 flex-row items-center justify-center">{leftIcon}</View>}
        {typeof children === 'string' ? (
          <Text className={twMerge(textVariants[variant], textSizes[size], textClassName)}>
            {children}
          </Text>
        ) : (
          children
        )}
        {!isLoading && rightIcon && <View className="ml-2 flex-row items-center justify-center">{rightIcon}</View>}
      </Pressable>
    );
  }
);

Button.displayName = 'Button';
