import React from 'react';
import {
  TouchableOpacity,
  TouchableOpacityProps,
  ActivityIndicator,
  StyleSheet,
  ViewStyle,
  View,
} from 'react-native';
import { Typography } from './Typography';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'success';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends TouchableOpacityProps {
  title?: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  children?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  fullWidth = false,
  leftIcon,
  rightIcon,
  children,
  style,
  onPress,
  ...props
}) => {
  const isInteractive = !disabled && !loading;

  const buttonStyle: ViewStyle[] = [
    styles.base,
    styles[`size_${size}` as keyof typeof styles] as ViewStyle,
    styles[`variant_${variant}` as keyof typeof styles] as ViewStyle,
    fullWidth && styles.fullWidth,
    (disabled || loading) && styles.disabled,
    style as ViewStyle,
  ];

  const getTextColor = (): 'white' | 'primary' | 'default' | 'danger' | 'success' | 'secondary' | 'muted' => {
    if (disabled) return 'muted';
    switch (variant) {
      case 'primary':
      case 'danger':
      case 'success':
        return 'white';
      case 'secondary':
        return 'default';
      case 'outline':
      case 'ghost':
        return 'primary';
      default:
        return 'white';
    }
  };

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      disabled={!isInteractive}
      onPress={onPress}
      style={buttonStyle}
      {...props}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variant === 'primary' || variant === 'danger' || variant === 'success' ? '#FFFFFF' : '#2563EB'}
        />
      ) : (
        <View style={styles.contentContainer}>
          {leftIcon && <View style={styles.iconLeft}>{leftIcon}</View>}
          {title ? (
            <Typography
              variant={size === 'sm' ? 'bodyBold' : 'subtitle'}
              color={getTextColor()}
              style={styles.text}
            >
              {title}
            </Typography>
          ) : (
            children
          )}
          {rightIcon && <View style={styles.iconRight}>{rightIcon}</View>}
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
  },
  fullWidth: {
    width: '100%',
  },
  contentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    textAlign: 'center',
    fontWeight: '600',
  },
  iconLeft: {
    marginRight: 8,
  },
  iconRight: {
    marginLeft: 8,
  },
  disabled: {
    opacity: 0.5,
  },
  // Sizes
  size_sm: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 8,
    minHeight: 36,
  },
  size_md: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    minHeight: 48,
  },
  size_lg: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 14,
    minHeight: 56,
  },
  // Variants
  variant_primary: {
    backgroundColor: '#2563EB',
  },
  variant_secondary: {
    backgroundColor: '#F1F5F9',
  },
  variant_outline: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: '#2563EB',
  },
  variant_ghost: {
    backgroundColor: 'transparent',
  },
  variant_danger: {
    backgroundColor: '#EF4444',
  },
  variant_success: {
    backgroundColor: '#10B981',
  },
});

export default Button;
