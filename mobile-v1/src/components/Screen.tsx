import React from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  SafeAreaView,
  StatusBar,
  StatusBarStyle,
  ViewStyle,
  RefreshControlProps,
} from 'react-native';

export interface ScreenProps {
  children: React.ReactNode;
  scrollable?: boolean;
  style?: ViewStyle;
  contentContainerStyle?: ViewStyle;
  statusBarStyle?: StatusBarStyle;
  statusBarColor?: string;
  backgroundColor?: string;
  refreshControl?: React.ReactElement<RefreshControlProps>;
}

export const Screen: React.FC<ScreenProps> = ({
  children,
  scrollable = true,
  style,
  contentContainerStyle,
  statusBarStyle = 'dark-content',
  statusBarColor = '#F8FAFC',
  backgroundColor = '#F8FAFC',
  refreshControl,
}) => {
  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor }]}>
      <StatusBar barStyle={statusBarStyle} backgroundColor={statusBarColor} />
      {scrollable ? (
        <ScrollView
          style={[styles.container, style]}
          contentContainerStyle={[styles.scrollContent, contentContainerStyle]}
          showsVerticalScrollIndicator={false}
          refreshControl={refreshControl}
        >
          {children}
        </ScrollView>
      ) : (
        <View style={[styles.container, styles.nonScrollContent, style]}>
          {children}
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 16,
    paddingBottom: 32,
  },
  nonScrollContent: {
    paddingHorizontal: 16,
  },
});

export default Screen;
