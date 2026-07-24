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
        <View style={styles.titleCopy}>
          <View style={styles.title} />
          <View style={styles.recipeCount} />
        </View>
      </View>
      <View style={styles.content}>
        <View style={styles.badges}>
          <View style={styles.status} />
          <View style={styles.visibility} />
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    marginBottom: theme.spacing.lg,
    ...theme.shadows.collectionCard,
  },
  cover: {
    minHeight: 55,
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    backgroundColor: theme.colors.surface,
    overflow: 'hidden',
    borderTopLeftRadius: theme.borderRadius.md - 1,
    borderTopRightRadius: theme.borderRadius.md - 1,
    marginTop: theme.spacing.sm,
  },
  content: {
    minHeight: 50,
    justifyContent: 'center',
    padding: theme.spacing.md,
  },
  titleCopy: {
    flex: 1,
    gap: 2,
  },
  title: {
    height: 18,
    backgroundColor: theme.colors.neutral[200],
    borderRadius: 9,
    width: '72%',
  },
  recipeCount: {
    height: 11,
    backgroundColor: theme.colors.neutral[200],
    width: '38%',
    borderRadius: 6,
  },
  badges: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  status: {
    width: 52,
    height: 12,
    backgroundColor: theme.colors.neutral[200],
    borderRadius: 6,
  },
  visibility: {
    width: 48,
    height: 12,
    backgroundColor: theme.colors.neutral[200],
    borderRadius: 6,
  },
});
