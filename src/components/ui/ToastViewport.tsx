import { useCallback, useEffect, useRef, useState } from "react";
import {
  Animated,
  Easing,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Check, CircleAlert, Info } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { theme } from "@styles/theme";
import { typography } from "@styles/typography";
import {
  subscribeToToasts,
  type ToastMessage,
  type ToastVariant,
} from "./toast";

const TAB_BAR_CLEARANCE = 68;

const variantStyles: Record<
  ToastVariant,
  { backgroundColor: string; foregroundColor: string }
> = {
  success: {
    backgroundColor: theme.colors.successBg,
    foregroundColor: theme.colors.successText,
  },
  error: {
    backgroundColor: theme.colors.errorBg,
    foregroundColor: theme.colors.errorText,
  },
  info: {
    backgroundColor: theme.colors.primary[50],
    foregroundColor: theme.colors.primary[600],
  },
};

function ToastIcon({ variant }: { variant: ToastVariant }) {
  const color = variantStyles[variant].foregroundColor;

  if (variant === "error") {
    return <CircleAlert size={16} color={color} strokeWidth={2.25} />;
  }

  if (variant === "info") {
    return <Info size={16} color={color} strokeWidth={2.25} />;
  }

  return <Check size={16} color={color} strokeWidth={2.5} />;
}

export function ToastViewport() {
  const insets = useSafeAreaInsets();
  const [currentToast, setCurrentToast] = useState<ToastMessage | null>(null);
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => subscribeToToasts(setCurrentToast), []);

  const dismiss = useCallback(
    (toastId: number) => {
      Animated.timing(progress, {
        toValue: 0,
        duration: 160,
        easing: Easing.in(Easing.quad),
        useNativeDriver: true,
      }).start(({ finished }) => {
        if (finished) {
          setCurrentToast((toastMessage) =>
            toastMessage?.id === toastId ? null : toastMessage,
          );
        }
      });
    },
    [progress],
  );

  useEffect(() => {
    if (!currentToast) return;

    progress.stopAnimation();
    progress.setValue(0);
    Animated.spring(progress, {
      toValue: 1,
      damping: 18,
      stiffness: 220,
      mass: 0.8,
      useNativeDriver: true,
    }).start();

    const timeout = setTimeout(
      () => dismiss(currentToast.id),
      currentToast.duration,
    );

    return () => {
      clearTimeout(timeout);
      progress.stopAnimation();
    };
  }, [currentToast, dismiss, progress]);

  if (!currentToast) return null;

  const colors = variantStyles[currentToast.variant];
  const translateY = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [12, 0],
  });

  const handleActionPress = () => {
    currentToast.action?.onPress();
    dismiss(currentToast.id);
  };

  return (
    <View
      pointerEvents="box-none"
      style={[
        styles.viewport,
        { bottom: insets.bottom + TAB_BAR_CLEARANCE },
      ]}
    >
      <Animated.View
        style={[
          styles.toast,
          {
            opacity: progress,
            transform: [{ translateY }],
          },
        ]}
      >
        <View
          style={[
            styles.iconContainer,
            { backgroundColor: colors.backgroundColor },
          ]}
        >
          <ToastIcon variant={currentToast.variant} />
        </View>
        <Text
          accessible
          accessibilityLiveRegion="polite"
          accessibilityRole="alert"
          numberOfLines={2}
          style={styles.message}
        >
          {currentToast.message}
        </Text>
        {currentToast.action && (
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel={currentToast.action.label}
            activeOpacity={0.65}
            onPress={handleActionPress}
            style={styles.action}
          >
            <Text style={styles.actionText}>{currentToast.action.label}</Text>
          </TouchableOpacity>
        )}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  viewport: {
    position: "absolute",
    left: 0,
    right: 0,
    zIndex: 1000,
    elevation: 12,
    alignItems: "center",
    paddingHorizontal: theme.spacing.lg,
  },
  toast: {
    width: "100%",
    maxWidth: 420,
    minHeight: 46,
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.sm,
    paddingVertical: 9,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.neutral[200],
    backgroundColor: theme.colors.surface,
    shadowColor: theme.colors.neutral[900],
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.13,
    shadowRadius: 12,
    elevation: 7,
  },
  iconContainer: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
  },
  message: {
    flex: 1,
    flexShrink: 1,
    fontFamily: typography.primarySemiBold,
    fontSize: typography.sizes.sm,
    lineHeight: 18,
    color: theme.colors.neutral[800],
  },
  action: {
    minHeight: 32,
    justifyContent: "center",
    paddingHorizontal: theme.spacing.xs,
  },
  actionText: {
    fontFamily: typography.primarySemiBold,
    fontSize: typography.sizes.sm,
    color: theme.colors.primary[600],
  },
});
