import React, { useLayoutEffect, useRef, useState } from "react";
import {
  Animated,
  Easing,
  StyleSheet,
  View,
  type ViewStyle,
  type StyleProp,
} from "react-native";

interface LoadingTransitionProps {
  loading: boolean;
  loadingView: React.ReactNode;
  children?: React.ReactNode;
  duration?: number;
  style?: StyleProp<ViewStyle>;
}

/**
 * Keeps the loading UI over the real screen for one layout pass, then fades it
 * away. This prevents a loader from exposing an unmeasured or partially filled
 * native list for a frame when query data first arrives.
 */
export function LoadingTransition({
  loading,
  loadingView,
  children,
  duration = 160,
  style,
}: LoadingTransitionProps) {
  const loaderOpacity = useRef(new Animated.Value(1)).current;
  const [isLoaderMounted, setIsLoaderMounted] = useState(loading);
  const showLoader = loading || isLoaderMounted;

  useLayoutEffect(() => {
    let firstFrame: number | undefined;
    let secondFrame: number | undefined;

    if (loading) {
      loaderOpacity.stopAnimation();
      loaderOpacity.setValue(1);
      setIsLoaderMounted(true);
      return;
    }

    if (!isLoaderMounted) return;

    // Let the content mount and complete its first native layout/list batch
    // behind the opaque loader before beginning the handoff.
    firstFrame = requestAnimationFrame(() => {
      secondFrame = requestAnimationFrame(() => {
        Animated.timing(loaderOpacity, {
          toValue: 0,
          duration,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }).start(({ finished }) => {
          if (finished) setIsLoaderMounted(false);
        });
      });
    });

    return () => {
      if (firstFrame !== undefined) cancelAnimationFrame(firstFrame);
      if (secondFrame !== undefined) cancelAnimationFrame(secondFrame);
      loaderOpacity.stopAnimation();
    };
  }, [duration, isLoaderMounted, loaderOpacity, loading]);

  return (
    <View style={[styles.container, style]}>
      <View
        style={styles.content}
        accessibilityElementsHidden={showLoader}
        importantForAccessibility={showLoader ? "no-hide-descendants" : "auto"}
      >
        {children}
      </View>

      {showLoader ? (
        <Animated.View
          testID="loading-transition-overlay"
          style={[styles.loader, { opacity: loaderOpacity }]}
        >
          {loadingView}
        </Animated.View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  loader: {
    ...StyleSheet.absoluteFillObject,
  },
});
