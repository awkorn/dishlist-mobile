import React, { useEffect, useRef, useState } from "react";
import {
  AccessibilityInfo,
  Animated,
  Easing,
  Image,
  StyleSheet,
  View,
} from "react-native";
import { theme } from "@styles/theme";
import { typography } from "@styles/typography";

export function BrandedLoadingScreen() {
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const logoScale = useRef(new Animated.Value(0.88)).current;
  const logoTranslateX = useRef(new Animated.Value(0)).current;
  const nameOpacity = useRef(new Animated.Value(0)).current;
  const nameScale = useRef(new Animated.Value(0.84)).current;
  const nameTranslateX = useRef(new Animated.Value(-8)).current;
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    let mounted = true;

    AccessibilityInfo.isReduceMotionEnabled().then((enabled) => {
      if (mounted) setReduceMotion(enabled);
    });

    const subscription = AccessibilityInfo.addEventListener(
      "reduceMotionChanged",
      setReduceMotion
    );

    return () => {
      mounted = false;
      subscription.remove();
    };
  }, []);

  useEffect(() => {
    if (reduceMotion) {
      logoOpacity.setValue(1);
      logoScale.setValue(1);
      logoTranslateX.setValue(-66);
      nameOpacity.setValue(1);
      nameScale.setValue(1);
      nameTranslateX.setValue(0);
      return;
    }

    const animation = Animated.sequence([
      Animated.parallel([
        Animated.timing(logoOpacity, {
          toValue: 1,
          duration: 240,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(logoScale, {
          toValue: 1,
          duration: 220,
          easing: Easing.out(Easing.back(1.1)),
          useNativeDriver: true,
        }),
      ]),
      Animated.delay(70),
      Animated.timing(logoTranslateX, {
        toValue: -66,
        duration: 260,
        easing: Easing.inOut(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.parallel([
        Animated.timing(nameOpacity, {
          toValue: 1,
          duration: 150,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(nameScale, {
          toValue: 1,
          duration: 220,
          easing: Easing.out(Easing.back(1.35)),
          useNativeDriver: true,
        }),
        Animated.timing(nameTranslateX, {
          toValue: 0,
          duration: 190,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
      ]),
    ]);

    animation.start();
    return () => animation.stop();
  }, [
    logoOpacity,
    logoScale,
    logoTranslateX,
    nameOpacity,
    nameScale,
    nameTranslateX,
    reduceMotion,
  ]);

  return (
    <View
      style={styles.container}
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel="Opening DishList"
      accessibilityLiveRegion="polite"
      accessibilityState={{ busy: true }}
    >
      <View
        style={styles.brand}
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
      >
        <Animated.View
          style={[
            styles.logoViewport,
            {
              opacity: logoOpacity,
              transform: [
                { translateX: logoTranslateX },
                { scale: logoScale },
              ],
            },
          ]}
        >
          <Image
            source={require("../../../assets/images/dishlist-logo.png")}
            style={styles.logo}
            resizeMode="contain"
          />
        </Animated.View>
        <Animated.Text
          style={[
            styles.brandName,
            {
              opacity: nameOpacity,
              transform: [
                { translateX: nameTranslateX },
                { scale: nameScale },
              ],
            },
          ]}
        >
          DishList
        </Animated.Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: theme.colors.background,
  },
  brand: {
    width: 210,
    height: 52,
    justifyContent: "center",
  },
  logoViewport: {
    position: "absolute",
    left: 81,
    width: 48,
    height: 48,
    overflow: "hidden",
  },
  logo: {
    position: "absolute",
    left: -24,
    top: -24,
    width: 96,
    height: 96,
  },
  brandName: {
    position: "absolute",
    left: 71,
    fontFamily: typography.families.editorialSemiBold,
    fontSize: 36,
    lineHeight: 42,
    letterSpacing: -0.8,
    color: theme.colors.textPrimary,
  },
});
