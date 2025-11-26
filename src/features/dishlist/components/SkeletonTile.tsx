import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Dimensions } from 'react-native';
import { theme } from '@styles/theme';

const { width } = Dimensions.get('window');
const tileWidth = (width - 60) / 2;

interface SkeletonTileProps {
  index?: number;
}

export function SkeletonTile({ index = 0 }: SkeletonTileProps) {
  const animatedValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(animatedValue, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(animatedValue, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );
    
    animation.start();
    
    return () => animation.stop();
  }, [animatedValue]);

  const opacity = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  return (
    <Animated.View style={[styles.container, { width: tileWidth, opacity }]}>
      <View style={styles.content}>
        <View style={styles.title} />
        <View style={styles.text} />
        <View style={styles.badges}>
          <View style={styles.badge} />
          <View style={styles.badge} />
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.colors.neutral[100],
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
    minHeight: 120,
  },
  content: {
    flex: 1,
    justifyContent: 'space-between',
  },
  title: {
    height: 20,
    backgroundColor: theme.colors.neutral[200],
    borderRadius: theme.borderRadius.sm,
    width: '80%',
    marginBottom: theme.spacing.sm,
  },
  text: {
    height: 14,
    backgroundColor: theme.colors.neutral[200],
    borderRadius: theme.borderRadius.sm,
    width: '50%',
    marginBottom: theme.spacing.md,
  },
  badges: {
    flexDirection: 'row',
    gap: theme.spacing.xs,
  },
  badge: {
    width: 24,
    height: 24,
    backgroundColor: theme.colors.neutral[200],
    borderRadius: 6,
  },
});