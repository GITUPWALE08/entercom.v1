import React, { useRef, useCallback } from 'react';
import { ScrollView, ScrollViewProps } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { useScrollToTop } from '@react-navigation/native';

export function AppScrollView(props: ScrollViewProps) {
  const ref = useRef<ScrollView>(null);

  // Scroll to top when tapping the active tab bar icon
  useScrollToTop(ref);

  // Scroll to top automatically when the screen comes into focus
  useFocusEffect(
    useCallback(() => {
      ref.current?.scrollTo({ y: 0, animated: false });
    }, [])
  );

  return <ScrollView ref={ref} {...props} />;
}
