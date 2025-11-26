import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { Wifi, WifiOff } from 'lucide-react-native';
import { typography } from '@styles/typography';

interface NetworkIndicatorProps {
  isOnline: boolean;
}

export function NetworkIndicator({ isOnline }: NetworkIndicatorProps) {
  const animatedValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(animatedValue, {
      toValue: isOnline ? 0 : 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [isOnline, animatedValue]);

  const translateY = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [-50, 0],
  });

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [{ translateY }],
          backgroundColor: isOnline ? '#10B981' : '#EF4444',
        },
      ]}
    >
      {isOnline ? (
        <>
          <Wifi size={16} color="white" />
          <Text style={styles.text}>Back Online</Text>
        </>
      ) : (
        <>
          <WifiOff size={16} color="white" />
          <Text style={styles.text}>No Connection - Showing Cached Data</Text>
        </>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    zIndex: 100,
    gap: 8,
  },
  text: {
    ...typography.caption,
    color: 'white',
    fontWeight: '600',
  },
});