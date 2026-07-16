import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Dimensions } from 'react-native';
import { theme } from '@styles/theme';

const { width } = Dimensions.get('window');
const tileWidth = (width - theme.spacing.xl * 2 - theme.spacing.lg) / 2;

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
      <View style={styles.cover}>
        <View style={styles.title} />
        <View style={styles.text} />
      </View>
      <View style={styles.content}>
        <View style={styles.badges}>
          <View style={styles.badgeWide} />
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
    borderWidth: 1,
    borderColor: theme.colors.navyBorder,
    marginBottom: theme.spacing.lg,
    overflow: 'hidden',
  },
  cover: {
    height: 88,
    backgroundColor: theme.colors.neutral[200],
    justifyContent: 'flex-end',
    padding: theme.spacing.lg,
    gap: 4,
  },
  content: {
    height: 52,
    justifyContent: 'center',
    padding: theme.spacing.md,
  },
  title: {
    height: 20,
    backgroundColor: theme.colors.neutral[100],
    borderRadius: theme.borderRadius.sm,
    width: '80%',
  },
  text: {
    height: 14,
    backgroundColor: theme.colors.neutral[100],
    width: '42%',
    borderRadius: 7,
  },
  badges: {
    flexDirection: 'row',
    gap: 6,
  },
  badgeWide: {
    width: 58,
    height: 24,
    backgroundColor: theme.colors.neutral[200],
    borderRadius: 12,
  },
  badge: {
    width: 64,
    height: 24,
    backgroundColor: theme.colors.neutral[200],
    borderRadius: 12,
  },
});
