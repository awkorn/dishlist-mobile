import React, { useCallback, useEffect, useState } from "react";
import {
  AccessibilityInfo,
  ActivityIndicator,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
  type TextProps,
} from "react-native";
import {
  close,
  openHostApp,
  type InitialProps,
} from "expo-share-extension";
import { getShareExtensionAccessToken } from "./sharedAuth";
import {
  extractSharedUrl,
  startSocialImport,
} from "./shareExtensionApi";
import {
  writePendingSharedImages,
  writePendingSharedUrl,
} from "./sharedStorage";
import { shareLog } from "./logger";

const colors = {
  background: "#F7F5F3",
  surface: "#FFFFFF",
  primary: "#1658C7",
  textPrimary: "#00295B",
  textMuted: "#4B5563",
  error: "#B42318",
  successSurface: "#DCE8FC",
  secondaryAction: "#E1E3E6",
};

const AUTO_CLOSE_DELAY_MS = 3000;

type ExtensionState =
  | { name: "starting" }
  | { name: "started" }
  | { name: "already-saved"; recipeId: string }
  | { name: "needs-signin" }
  | { name: "shared-images" }
  | { name: "unsupported" }
  | { name: "rate-limited"; message: string }
  | { name: "error"; message: string };

// Native Text is retained for the extension-target font-scaling workaround;
// the sheet has larger base sizes, generous height, VoiceOver announcements,
// and never auto-dismisses while a screen reader is active.
const T = (props: TextProps) => (
  <Text allowFontScaling={false} maxFontSizeMultiplier={1.4} {...props} />
);

export default function ShareExtensionRoot(initialProps: InitialProps) {
  const [state, setState] = useState<ExtensionState>({ name: "starting" });
  const [screenReaderEnabled, setScreenReaderEnabled] = useState(false);

  useEffect(() => {
    void Promise.resolve(
      AccessibilityInfo.isScreenReaderEnabled?.() ?? false
    ).then(setScreenReaderEnabled);
  }, []);

  const runImport = useCallback(async () => {
    setState({ name: "starting" });

    if (initialProps.images?.length) {
      writePendingSharedImages(initialProps.images);
      setState({ name: "shared-images" });
      return;
    }

    const url = extractSharedUrl(initialProps);
    if (!url) {
      setState({ name: "unsupported" });
      return;
    }

    const auth = await getShareExtensionAccessToken();
    if (auth.status === "signed-out") {
      writePendingSharedUrl(url);
      setState({ name: "needs-signin" });
      return;
    }
    if (auth.status === "error") {
      setState({
        name: "error",
        message: "DishList couldn't verify your sign-in. Open the app and try again.",
      });
      return;
    }

    let result = await startSocialImport(url, auth.accessToken);
    if (result.status === "auth-failed") {
      const refreshed = await getShareExtensionAccessToken({ forceRefresh: true });
      if (refreshed.status === "ok") {
        result = await startSocialImport(url, refreshed.accessToken);
      }
    }

    shareLog.info(`Import result: ${result.status}`);
    switch (result.status) {
      case "accepted":
        setState({ name: "started" });
        break;
      case "already-saved":
        setState({ name: "already-saved", recipeId: result.recipeId });
        break;
      case "auth-failed":
        writePendingSharedUrl(url);
        setState({ name: "needs-signin" });
        break;
      case "unsupported-url":
        setState({ name: "unsupported" });
        break;
      case "rate-limited":
        setState({ name: "rate-limited", message: result.message });
        break;
      case "error":
        setState({ name: "error", message: result.message });
        break;
    }
  }, [initialProps]);

  useEffect(() => {
    void runImport();
  }, [runImport]);

  useEffect(() => {
    const announcements: Partial<Record<ExtensionState["name"], string>> = {
      started:
        "Recipe import started. DishList will notify you when it is added to My Recipes.",
      "already-saved": "This recipe is already in My Recipes.",
      "needs-signin": "Sign in required. The shared link will be saved.",
      unsupported: "This shared item is not supported.",
      "rate-limited": "Import limit reached.",
      error: "Import could not start.",
    };
    const announcement = announcements[state.name];
    if (announcement) AccessibilityInfo.announceForAccessibility?.(announcement);
  }, [state.name]);

  useEffect(() => {
    if (
      !screenReaderEnabled &&
      (state.name === "started" || state.name === "already-saved")
    ) {
      const timer = setTimeout(close, AUTO_CLOSE_DELAY_MS);
      return () => clearTimeout(timer);
    }
  }, [screenReaderEnabled, state.name]);

  const button = (
    label: string,
    onPress: () => void,
    primary = false
  ) => (
    <Pressable
      style={primary ? styles.primaryButton : styles.secondaryButton}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <T style={primary ? styles.primaryButtonText : styles.secondaryButtonText}>
        {label}
      </T>
    </Pressable>
  );

  return (
    <View style={styles.container} accessibilityViewIsModal>
      <Image
        source={require("../../../assets/images/dishlist-logo.png")}
        style={styles.brandMark}
        resizeMode="contain"
        accessibilityLabel="DishList"
      />

      {state.name === "starting" && (
        <View style={styles.body} accessibilityLiveRegion="polite">
          <ActivityIndicator size="large" color={colors.primary} />
          <T style={styles.title}>Starting import…</T>
          <T style={styles.subtitle}>You can close this after it starts</T>
        </View>
      )}

      {state.name === "started" && (
        <View style={styles.body} accessibilityLiveRegion="polite">
          <View style={styles.successIcon} accessibilityLabel="Import started">
            <T style={styles.successCheck}>✓</T>
          </View>
          <T style={styles.title}>Recipe import started</T>
          <T style={styles.subtitle}>
            DishList will notify you when it’s added to My Recipes.
          </T>
          {button("Close", close)}
        </View>
      )}

      {state.name === "already-saved" && (
        <View style={styles.body} accessibilityLiveRegion="polite">
          <View style={styles.successIcon}><T style={styles.successCheck}>✓</T></View>
          <T style={styles.title}>Already in My Recipes</T>
          <T style={styles.subtitle}>DishList found the recipe you saved earlier.</T>
          <View style={styles.buttonRow}>
            {button("Close", close)}
            {button("View recipe", () => {
              openHostApp(`recipe/${state.recipeId}`);
              close();
            }, true)}
          </View>
        </View>
      )}

      {state.name === "needs-signin" && (
        <View style={styles.body}>
          <T style={styles.title}>Sign in to start import</T>
          <T style={styles.subtitle}>We saved this link and will resume after you sign in.</T>
          {button("Open DishList", () => {
            openHostApp("login");
            close();
          }, true)}
        </View>
      )}

      {state.name === "shared-images" && (
        <View style={styles.body}>
          <T style={styles.title}>Import recipe screenshots</T>
          <T style={styles.subtitle}>Open DishList to review the images and choose where to save the recipe.</T>
          {button("Continue in DishList", () => {
            openHostApp("shared-image-import");
            close();
          }, true)}
        </View>
      )}

      {state.name === "unsupported" && (
        <View style={styles.body}>
          <T style={styles.title}>Post not supported</T>
          <T style={styles.subtitle}>
            Share a TikTok, Instagram, Facebook, YouTube, or Pinterest post—or recipe screenshots.
          </T>
          {button("Close", close)}
        </View>
      )}

      {state.name === "rate-limited" && (
        <View style={styles.body} accessibilityLiveRegion="assertive">
          <T style={styles.title}>Import limit reached</T>
          <T style={styles.subtitle}>{state.message}</T>
          {button("Close", close)}
        </View>
      )}

      {state.name === "error" && (
        <View style={styles.body} accessibilityLiveRegion="assertive">
          <T style={[styles.title, styles.errorTitle]}>Couldn’t start import</T>
          <T style={styles.subtitle}>{state.message}</T>
          <View style={styles.buttonRow}>
            {button("Cancel", close)}
            {button("Try again", () => void runImport(), true)}
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    borderRadius: 12,
    paddingHorizontal: 24,
  },
  brandMark: { position: "absolute", top: 8, left: 14, width: 50, height: 50 },
  body: {
    flex: 1,
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 18,
  },
  title: {
    fontSize: 20,
    lineHeight: 27,
    fontWeight: "700",
    color: colors.textPrimary,
    textAlign: "center",
    marginTop: 12,
  },
  errorTitle: { color: colors.error },
  subtitle: {
    fontSize: 15,
    lineHeight: 21,
    color: colors.textMuted,
    textAlign: "center",
    marginTop: 7,
    maxWidth: 320,
  },
  successIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.successSurface,
  },
  successCheck: { color: colors.primary, fontSize: 23, lineHeight: 27, fontWeight: "700" },
  buttonRow: { flexDirection: "row", gap: 12, marginTop: 20 },
  primaryButton: {
    backgroundColor: colors.primary,
    minWidth: 110,
    minHeight: 44,
    borderRadius: 10,
    paddingVertical: 11,
    paddingHorizontal: 18,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 20,
  },
  primaryButtonText: { color: colors.surface, fontSize: 15, lineHeight: 20, fontWeight: "700" },
  secondaryButton: {
    backgroundColor: colors.secondaryAction,
    minWidth: 100,
    minHeight: 44,
    borderRadius: 10,
    paddingVertical: 11,
    paddingHorizontal: 18,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 20,
  },
  secondaryButtonText: { color: colors.textPrimary, fontSize: 15, lineHeight: 20, fontWeight: "700" },
});
