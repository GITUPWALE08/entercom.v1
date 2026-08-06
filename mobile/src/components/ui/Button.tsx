import React, { forwardRef } from 'react';
import { Text, View, ActivityIndicator, PressableProps, Platform } from 'react-native';
import { twMerge } from 'tailwind-merge';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { Pressable } from 'react-native';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

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
  ({ className = '', textClassName = '', variant = 'primary', size = 'md', isLoading = false, leftIcon, rightIcon, children, disabled, onPressIn, onPressOut, ...props }, ref) => {
    const scale = useSharedValue(1);
    const opacity = useSharedValue(1);

    const handlePressIn = (e: any) => {
      scale.value = withSpring(0.96, { damping: 15, stiffness: 300 });
      opacity.value = withTiming(0.85, { duration: 150 });
      if (onPressIn) onPressIn(e);
    };

    const handlePressOut = (e: any) => {
      scale.value = withSpring(1, { damping: 15, stiffness: 300 });
      opacity.value = withTiming(1, { duration: 150 });
      if (onPressOut) onPressOut(e);
    };

    const animatedStyle = useAnimatedStyle(() => ({
      transform: [{ scale: scale.value }],
      opacity: opacity.value,
    }));

    // Premium styling
    const baseStyles = 'flex-row items-center justify-center rounded-[20px] shadow-sm';
    
    const variants: Record<ButtonVariant, string> = {
      primary: 'bg-ess-purple border border-ess-purple/10',
      secondary: 'bg-ess-softBlue border border-white',
      danger: 'bg-red-500',
      outline: 'border-2 border-ess-purple/20 bg-transparent',
      ghost: 'bg-transparent shadow-none',
      link: 'bg-transparent p-0 h-auto shadow-none',
    };

    const sizes: Record<ButtonSize, string> = {
      sm: 'h-10 px-5 gap-2',
      md: 'h-14 px-7 gap-2.5',
      lg: 'h-16 px-9 gap-3',
    };

    const textVariants: Record<ButtonVariant, string> = {
      primary: 'text-white font-semibold tracking-wide',
      secondary: 'text-ess-darkPurple font-semibold tracking-wide',
      danger: 'text-white font-semibold tracking-wide',
      outline: 'text-ess-purple font-semibold tracking-wide',
      ghost: 'text-ess-purple font-semibold tracking-wide',
      link: 'text-ess-darkPurple font-semibold underline tracking-wide',
    };

    const textSizes: Record<ButtonSize, string> = {
      sm: 'text-sm',
      md: 'text-base',
      lg: 'text-lg',
    };

    return (
      <AnimatedPressable
        ref={ref}
        disabled={disabled || isLoading}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        className={twMerge(
          baseStyles,
          variants[variant],
          variant !== 'link' ? sizes[size] : '',
          (disabled || isLoading) ? 'opacity-50' : '',
          className
        )}
        style={[animatedStyle, {
          elevation: variant === 'primary' ? 4 : 0,
          shadowColor: variant === 'primary' ? '#081f3d' : 'transparent',
        }]}
        {...props}
      >
        {isLoading && (
          <ActivityIndicator 
            color={variant === 'outline' || variant === 'ghost' || variant === 'secondary' ? '#081f3d' : '#FFFFFF'} 
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
      </AnimatedPressable>
    );
  }
);

Button.displayName = 'Button';
