import React from 'react';
import { Text as RNText, TextProps as RNTextProps, StyleSheet, TextStyle } from 'react-native';

export type TypographyVariant =
  | 'h1'
  | 'h2'
  | 'h3'
  | 'subtitle'
  | 'body'
  | 'bodyBold'
  | 'caption'
  | 'label'
  | 'code';

export type TypographyColor =
  | 'default'
  | 'primary'
  | 'secondary'
  | 'muted'
  | 'white'
  | 'success'
  | 'warning'
  | 'danger'
  | 'accent';

export interface TypographyProps extends RNTextProps {
  variant?: TypographyVariant;
  color?: TypographyColor;
  align?: 'auto' | 'left' | 'right' | 'center' | 'justify';
  weight?: TextStyle['fontWeight'];
  children?: React.ReactNode;
}

export const Typography: React.FC<TypographyProps> = ({
  variant = 'body',
  color = 'default',
  align = 'left',
  weight,
  style,
  children,
  ...props
}) => {
  const textStyles: TextStyle[] = [
    styles.base,
    styles[variant],
    colorStyles[color],
    { textAlign: align },
    weight ? { fontWeight: weight } : {},
    style as TextStyle,
  ];

  return (
    <RNText style={textStyles} {...props}>
      {children}
    </RNText>
  );
};

const colorStyles: Record<TypographyColor, TextStyle> = StyleSheet.create({
  default: { color: '#0F172A' },
  primary: { color: '#2563EB' },
  secondary: { color: '#475569' },
  muted: { color: '#64748B' },
  white: { color: '#FFFFFF' },
  success: { color: '#10B981' },
  warning: { color: '#F59E0B' },
  danger: { color: '#EF4444' },
  accent: { color: '#6366F1' },
});

const styles = StyleSheet.create({
  base: {
    fontFamily: 'System',
  },
  h1: {
    fontSize: 28,
    lineHeight: 34,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  h2: {
    fontSize: 22,
    lineHeight: 28,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  h3: {
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '600',
  },
  subtitle: {
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '500',
  },
  body: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '400',
  },
  bodyBold: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '600',
  },
  caption: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '400',
  },
  label: {
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  code: {
    fontSize: 13,
    lineHeight: 18,
    fontFamily: 'Courier',
    fontWeight: '500',
  },
});

export default Typography;
