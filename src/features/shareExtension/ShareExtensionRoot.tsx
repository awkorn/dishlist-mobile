// Root component of the iOS share extension (registered in index.share.tsx).
// Runs in a separate process with a tiny RN bundle: React, RN primitives,
// react-native-mmkv and bare fetch only — no navigation, supabase-js, axios,
// react-query, or icon fonts. RN <Text> needs allowFontScaling={false} inside
// share extensions (font-scaling bug), hence the local T wrapper.

import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
  type TextProps,
} from "react-native";
import { close, openHostApp } from "expo-share-extension";
import { getShareExtensionAccessToken } from "./sharedAuth";
import {
  extractSharedUrl,
  isSupportedSocialUrl,
  startSocialImport,
} from "./shareExtensionApi";
import { shareLog } from "./logger";

const colors = {
  background: "#F7F5F3",
  surface: "#FFFFFF",
  primary: "#2563eb",
  textPrimary: "#00295B",
  textMuted: "#6B7280",
  error: "#EF4444",
  successSurface: "#DCE8FC",
  secondaryAction: "#E1E3E6",
};

const AUTO_CLOSE_DELAY_MS = 1500;

type ExtensionState =
  | "saving"
  | "saved"
  | "needs-signin"
  | "unsupported"
  | "error";

const T = (props: TextProps) => <Text allowFontScaling={false} {...props} />;

export default function ShareExtensionRoot(initialProps: {
  url?: string;
  text?: string;
}) {
  const [state, setState] = useState<ExtensionState>("saving");

  const runImport = useCallback(async () => {
    setState("saving");

    const url = extractSharedUrl(initialProps);
    if (!url || !isSupportedSocialUrl(url)) {
      shareLog.warn(`Unsupported or missing URL: ${url ?? "none"}`);
      setState("unsupported");
      return;
    }
    shareLog.info(`Starting import for ${url}`);

    const auth = await getShareExtensionAccessToken();
    if (auth.status === "signed-out") {
      shareLog.info("Auth: signed-out → needs-signin");
      setState("needs-signin");
      return;
    }
    if (auth.status === "error") {
      shareLog.error("Auth: error → showing error state");
      setState("error");
      return;
    }

    let result = await startSocialImport(url, auth.accessToken);

    // The cached token can be rejected before its local expiry (for example
    // after server-side revocation or a clock skew). Refresh once and retry the
    // idempotent import-start request instead of requiring the host app to run.
    if (result.status === "auth-failed") {
      shareLog.info("Import authentication failed — refreshing and retrying");
      const refreshedAuth = await getShareExtensionAccessToken({
        forceRefresh: true,
      });
      if (refreshedAuth.status === "ok") {
        result = await startSocialImport(url, refreshedAuth.accessToken);
      } else if (refreshedAuth.status === "error") {
        setState("error");
        return;
      }
    }

    shareLog.info(`Import result: ${result.status}`);
    switch (result.status) {
      case "accepted":
        setState("saved");
        break;
      case "auth-failed":
        setState("needs-signin");
        break;
      case "unsupported-url":
        setState("unsupported");
        break;
      default:
        setState("error");
    }
  }, [initialProps]);

  useEffect(() => {
    void runImport();
  }, [runImport]);

  useEffect(() => {
    if (state === "saved") {
      const timer = setTimeout(() => close(), AUTO_CLOSE_DELAY_MS);
      return () => clearTimeout(timer);
    }
  }, [state]);

  return (
    <View style={styles.container}>
      <Image
        source={require("../../../assets/images/dishlist-logo.png")}
        style={styles.brandMark}
        resizeMode="contain"
        accessibilityLabel="DishList"
      />

      {state === "saving" && (
        <View style={styles.body}>
          <ActivityIndicator size="large" color={colors.primary} />
          <T style={styles.title}>Saving to My Recipes…</T>
        </View>
      )}

      {state === "saved" && (
        <View style={styles.body} accessibilityLiveRegion="polite">
          <T style={styles.title}>Saving recipe</T>
          <T style={styles.subtitle}>
            We&apos;ll notify you when it&apos;s been added
          </T>
          <View
            style={styles.successIcon}
            accessibilityLabel="Recipe saved"
          >
            <T style={styles.successCheck}>✓</T>
          </View>
        </View>
      )}

      {state === "needs-signin" && (
        <View style={styles.body}>
          <T style={styles.title}>Sign in to save recipes</T>
          <Pressable
            style={styles.primaryButton}
            onPress={() => {
              openHostApp("login");
              close();
            }}
          >
            <T style={styles.primaryButtonText}>Open DishList</T>
          </Pressable>
        </View>
      )}

      {state === "unsupported" && (
        <View style={styles.body}>
          <T style={styles.title}>Link not supported</T>
          <T style={styles.subtitle}>
            Share a TikTok, Instagram or Facebook post
          </T>
          <Pressable style={styles.secondaryButton} onPress={() => close()}>
            <T style={styles.secondaryButtonText}>Close</T>
          </Pressable>
        </View>
      )}

      {state === "error" && (
        <View style={styles.body}>
          <T style={styles.title}>Couldn&apos;t save recipe</T>
          <T style={styles.subtitle}>Check your connection and try again</T>
          <View style={styles.buttonRow}>
            <Pressable style={styles.secondaryButton} onPress={() => close()}>
              <T style={styles.secondaryButtonText}>Cancel</T>
            </Pressable>
            <Pressable
              style={styles.primaryButton}
              onPress={() => void runImport()}
            >
              <T style={styles.primaryButtonText}>Retry</T>
            </Pressable>
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
    borderRadius: 8,
    paddingHorizontal: 24,
  },
  brandMark: {
    position: "absolute",
    top: 4,
    left: 14,
    width: 50,
    height: 50,
  },
  body: {
    flex: 1,
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 18,
    lineHeight: 24,
    fontWeight: "600",
    color: colors.textPrimary,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 20,
    color: colors.textMuted,
    textAlign: "center",
    marginTop: 8,
  },
  successIcon: {
    width: 36,
    height: 36,
    borderRadius: 20,
    marginTop: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.successSurface,
  },
  successCheck: {
    color: colors.primary,
    fontSize: 20,
    lineHeight: 24,
    fontWeight: "700",
  },
  buttonRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 18,
  },
  primaryButton: {
    backgroundColor: colors.primary,
    minWidth: 90,
    minHeight: 36,
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryButtonText: {
    color: colors.surface,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "600",
  },
  secondaryButton: {
    backgroundColor: colors.secondaryAction,
    minWidth: 90,
    minHeight: 36,
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  secondaryButtonText: {
    color: colors.textPrimary,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "600",
  },
});
