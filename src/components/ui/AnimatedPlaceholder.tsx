import React, { useEffect, useRef, useState } from "react";
import { Animated, StyleSheet, View, Text } from "react-native";
import { theme } from "@styles/theme";
import { typography } from "@styles/typography";

interface AnimatedPlaceholderProps {
  prefix: string;
  keywords: string[];
  intervalMs?: number;
  style?: object;
}

const ANIMATION_DURATION = 300;

export function AnimatedPlaceholder({
  prefix,
  keywords,
  intervalMs = 3000,
  style,
}: AnimatedPlaceholderProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const translateY = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (keywords.length <= 1) return;

    const interval = setInterval(() => {
      // Slide up and fade out
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: -20,
          duration: ANIMATION_DURATION,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0,
          duration: ANIMATION_DURATION,
          useNativeDriver: true,
        }),
      ]).start(() => {
        // Update index
        setCurrentIndex((prev) => (prev + 1) % keywords.length);

        // Reset position to below, then slide up into view
        translateY.setValue(20);
        Animated.parallel([
          Animated.timing(translateY, {
            toValue: 0,
            duration: ANIMATION_DURATION,
            useNativeDriver: true,
          }),
          Animated.timing(opacity, {
            toValue: 1,
            duration: ANIMATION_DURATION,
            useNativeDriver: true,
          }),
        ]).start();
      });
    }, intervalMs);

    return () => clearInterval(interval);
  }, [keywords.length, intervalMs, translateY, opacity]);

  return (
    <View style={[styles.container, style]}>
      <Text style={styles.prefixText}>{prefix} </Text>
      <View style={styles.keywordContainer}>
        <Animated.Text
          style={[
            styles.keywordText,
            {
              transform: [{ translateY }],
              opacity,
            },
          ]}
          numberOfLines={1}
        >
          {keywords[currentIndex]}
        </Animated.Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    height: 24,
  },
  prefixText: {
    ...typography.body,
    color: theme.colors.neutral[400],
  },
  keywordContainer: {
    overflow: "hidden",
    height: 24,
    justifyContent: "center",
  },
  keywordText: {
    ...typography.body,
    color: theme.colors.neutral[400],
  },
});