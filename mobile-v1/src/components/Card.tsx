import React from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  ViewStyle,
  TouchableOpacityProps,
} from 'react-native';
import { Typography } from './Typography';

export type CardVariant = 'default' | 'elevated' | 'outlined' | 'accent' | 'dark';

export interface CardProps extends TouchableOpacityProps {
  variant?: CardVariant;
  title?: string;
  subtitle?: string;
  headerRight?: React.ReactNode;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  onPress?: () => void;
  children?: React.ReactNode;
  style?: ViewStyle;
}

export const Card: React.FC<CardProps> = ({
  variant = 'default',
  title,
  subtitle,
  headerRight,
  padding = 'md',
  onPress,
  children,
  style,
  ...props
}) => {
  const isTouchable = Boolean(onPress);
  const ContainerComponent = isTouchable ? TouchableOpacity : View;

  const cardStyle: ViewStyle[] = [
    styles.base,
    styles[`variant_${variant}` as keyof typeof styles] as ViewStyle,
    styles[`padding_${padding}` as keyof typeof styles] as ViewStyle,
    style as ViewStyle,
  ];

  return (
    <ContainerComponent
      activeOpacity={isTouchable ? 0.75 : 1}
      onPress={onPress}
      style={cardStyle}
      {...(isTouchable ? props : {})}
    >
      {(title || subtitle || headerRight) && (
        <View style={styles.header}>
          <View style={styles.headerTitles}>
            {title && (
              <Typography
                variant="h3"
                color={variant === 'dark' ? 'white' : 'default'}
                style={styles.title}
              >
                {title}
              </Typography>
            )}
            {subtitle && (
              <Typography
                variant="caption"
                color={variant === 'dark' ? 'muted' : 'secondary'}
                style={styles.subtitle}
              >
                {subtitle}
              </Typography>
            )}
          </View>
          {headerRight && <View style={styles.headerRight}>{headerRight}</View>}
        </View>
      )}
      {children}
    </ContainerComponent>
  );
};

const styles = StyleSheet.create({
  base: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  headerTitles: {
    flex: 1,
  },
  title: {
    fontWeight: '600',
  },
  subtitle: {
    marginTop: 2,
  },
  headerRight: {
    marginLeft: 12,
  },
  // Paddings
  padding_none: {
    padding: 0,
  },
  padding_sm: {
    padding: 12,
  },
  padding_md: {
    padding: 16,
  },
  padding_lg: {
    padding: 24,
  },
  // Variants
  variant_default: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  variant_elevated: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  variant_outlined: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
  },
  variant_accent: {
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  variant_dark: {
    backgroundColor: '#0F172A',
  },
});

export default Card;
