// Root component of the iOS share extension (registered in index.share.tsx).
// Runs in a separate process with a tiny RN bundle: React, RN primitives,
// react-native-mmkv and bare fetch only — no navigation, supabase-js, axios,
// react-query, or icon fonts. RN <Text> needs allowFontScaling={false} inside
// share extensions (font-scaling bug), hence the local T wrapper.

import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
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
  success: "#28af1b",
  error: "#EF4444",
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

    const result = await startSocialImport(url, auth.accessToken);
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
      <T style={styles.brand}>DishList</T>

      {state === "saving" && (
        <View style={styles.body}>
          <ActivityIndicator size="large" color={colors.primary} />
          <T style={styles.title}>Saving to My Recipes…</T>
        </View>
      )}

      {state === "saved" && (
        <View style={styles.body}>
          <View style={styles.checkCircle}>
            <T style={styles.checkMark}>✓</T>
          </View>
          <T style={styles.title}>Recipe saving</T>
          <T style={styles.subtitle}>We&apos;ll notify you when it&apos;s ready</T>
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
    borderRadius: 16,
    paddingVertical: 20,
    paddingHorizontal: 24,
    alignItems: "center",
  },
  brand: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.primary,
  },
  body: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  title: {
    fontSize: 17,
    fontWeight: "600",
    color: colors.textPrimary,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 14,
    color: colors.textMuted,
    textAlign: "center",
  },
  checkCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.success,
    alignItems: "center",
    justifyContent: "center",
  },
  checkMark: {
    color: colors.surface,
    fontSize: 24,
    fontWeight: "700",
  },
  buttonRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 6,
  },
  primaryButton: {
    backgroundColor: colors.primary,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 22,
    marginTop: 6,
  },
  primaryButtonText: {
    color: colors.surface,
    fontSize: 15,
    fontWeight: "600",
  },
  secondaryButton: {
    backgroundColor: colors.surface,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 22,
    marginTop: 6,
  },
  secondaryButtonText: {
    color: colors.textPrimary,
    fontSize: 15,
    fontWeight: "600",
  },
});
