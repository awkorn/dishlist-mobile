import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Alert,
  Linking,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { TouchableOpacity } from "react-native";
import { ChevronLeft } from "lucide-react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { RootStackParamList } from "@app-types/navigation";
import {
  Mail,
  Lock,
  LogOut,
  Trash2,
  Crown,
  Bell,
  CircleHelp,
  MessageSquare,
  Flag,
  Star,
  Info,
  FileText,
  Shield,
} from "lucide-react-native";
import { useAuth } from "@providers/AuthProvider/AuthContext";
import { usePushNotifications } from "@features/notifications";
import { api } from "@services/api";
import { supabase } from "@services/supabase";
import { SettingsSection, SettingsRow } from "../components";
import { theme } from "@styles/theme";
import { ScreenHeader, ScreenHeaderAction } from "@components/ui";
import Constants from "expo-constants";
import { groceryStorage } from "@features/grocery/services";

type Props = NativeStackScreenProps<RootStackParamList, "Settings">;

const SUPPORT_SITE_URL = "https://dishlists.app/";
const SUPPORT_EMAIL = "support@dishlists.app";

const URLS = {
  SUPPORT: SUPPORT_SITE_URL,
  SUPPORT_EMAIL: `mailto:${SUPPORT_EMAIL}`,
  TERMS: `${SUPPORT_SITE_URL}terms`,
  PRIVACY: `${SUPPORT_SITE_URL}privacy`,
  FAQ: SUPPORT_SITE_URL,
  // App Store URL - update with your actual app ID
  APP_STORE: "https://apps.apple.com/app/idYOUR_APP_ID",
};

export default function SettingsScreen({ navigation }: Props) {
  const { signOut, user } = useAuth();
  const { pushEnabled, togglePush } = usePushNotifications();
  const [isDeleting, setIsDeleting] = useState(false);

  const appVersion = Constants.expoConfig?.version ?? "1.0.0";
  const buildNumber =
    Constants.expoConfig?.ios?.buildNumber ?? "";

  // ── Handlers ──────────────────────────────────────────────

  const handleSignOut = useCallback(() => {
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign Out",
        style: "destructive",
        onPress: async () => {
          const result = await signOut();
          if (result.error) {
            Alert.alert("Unable to Sign Out", result.error);
          }
        },
      },
    ]);
  }, [signOut]);

  const handleDeleteAccount = useCallback(() => {
    if (isDeleting) return;

    Alert.alert(
      "Delete Account",
      "This will permanently delete your account and all your data. This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete Account",
          style: "destructive",
          onPress: async () => {
            setIsDeleting(true);
            try {
              await api.delete("/users/me");
              if (user?.id) {
                try {
                  await Promise.all([
                    groceryStorage.clearAll(user.id),
                    groceryStorage.clearLegacyItems(),
                  ]);
                } catch (storageError) {
                  // The account-scoped key cannot be read by another user, but
                  // still make a best-effort attempt to remove local remnants.
                  console.error(
                    "Failed to clear grocery data after account deletion:",
                    storageError
                  );
                }
              }
              const result = await signOut();
              if (result.error) {
                // The account is already deleted server-side, so always clear
                // the local Supabase session even if push cleanup was raced by
                // the deletion cascade.
                await supabase.auth.signOut({ scope: "local" });
              }
            } catch (error: any) {
              const message =
                error?.response?.data?.error || "Failed to delete account. Please try again.";
              Alert.alert("Error", message);
            } finally {
              setIsDeleting(false);
            }
          },
        },
      ]
    );
  }, [isDeleting, signOut, user?.id]);

  const handleOpenURL = useCallback(async (url: string) => {
    try {
      const canOpen = await Linking.canOpenURL(url);
      if (!canOpen) {
        throw new Error("No handler for URL");
      }
      await Linking.openURL(url);
    } catch (error) {
      const isEmail = url.startsWith("mailto:");
      Alert.alert(
        "Can't Open Link",
        isEmail
          ? `No email app is set up on this device. You can reach us at ${SUPPORT_EMAIL}.`
          : "We couldn't open that link. Please try again later."
      );
    }
  }, []);

  const handleRateApp = useCallback(() => {
    handleOpenURL(URLS.APP_STORE);
  }, [handleOpenURL]);

  const handlePushToggle = useCallback(
    (value: boolean) => {
      togglePush(value);
    },
    [togglePush]
  );

  // ── Render ────────────────────────────────────────────────

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <ScreenHeader
        title="Settings"
        leftSlot={
          <ScreenHeaderAction
            onPress={() => navigation.goBack()}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <ChevronLeft size={24} color={theme.colors.neutral[700]} />
          </ScreenHeaderAction>
        }
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Account ───────────────────────────────────────── */}
        <SettingsSection title="Account">
          <SettingsRow
            icon={<Mail size={18} color={theme.colors.neutral[600]} />}
            label="Email"
            rightText={user?.email ?? ""}
            onPress={() => navigation.navigate("ChangeEmail")}
          />
          <SettingsRow
            icon={<Lock size={18} color={theme.colors.neutral[600]} />}
            label="Change Password"
            onPress={() => navigation.navigate("ChangePassword")}
          />
          <SettingsRow
            icon={<LogOut size={18} color={theme.colors.neutral[600]} />}
            label="Sign Out"
            onPress={handleSignOut}
          />
          <SettingsRow
            icon={<Trash2 size={18} color={theme.colors.error} />}
            label="Delete Account"
            destructive
            showDivider={false}
            onPress={handleDeleteAccount}
            loading={isDeleting}
            disabled={isDeleting}
          />
        </SettingsSection>

        {/* ── Subscription ──────────────────────────────────── */}
        {/* Static until the RevenueCat paywall/management screen ships
            (see PRODUCTION_READINESS.md settings — Manual/flagged). Kept as a
            non-interactive info row so it can't present as a broken button. */}
        <SettingsSection title="Subscription">
          <SettingsRow
            icon={<Crown size={18} color={theme.colors.neutral[600]} />}
            label="Manage Subscription"
            subtitle="Free plan"
            type="static"
            showDivider={false}
          />
        </SettingsSection>

        {/* ── Notifications ─────────────────────────────────── */}
        <SettingsSection title="Notifications">
          <SettingsRow
            icon={<Bell size={18} color={theme.colors.neutral[600]} />}
            label="Push Notifications"
            type="toggle"
            value={pushEnabled}
            onValueChange={handlePushToggle}
            showDivider={false}
          />
        </SettingsSection>

        {/* ── Support ───────────────────────────────────────── */}
        <SettingsSection title="Support">
          <SettingsRow
            icon={<CircleHelp size={18} color={theme.colors.neutral[600]} />}
            label="Help & Support"
            subtitle="dishlists.app"
            onPress={() => handleOpenURL(URLS.FAQ)}
          />
          <SettingsRow
            icon={
              <MessageSquare size={18} color={theme.colors.neutral[600]} />
            }
            label="Contact Support"
            subtitle={SUPPORT_EMAIL}
            onPress={() => handleOpenURL(URLS.SUPPORT_EMAIL)}
          />
          <SettingsRow
            icon={<Flag size={18} color={theme.colors.neutral[600]} />}
            label="Report a Problem"
            onPress={() => handleOpenURL(URLS.SUPPORT)}
          />
          <SettingsRow
            icon={<Star size={18} color={theme.colors.neutral[600]} />}
            label="Rate DishList"
            onPress={handleRateApp}
            showDivider={false}
          />
        </SettingsSection>

        {/* ── About ─────────────────────────────────────────── */}
        <SettingsSection title="About">
          <SettingsRow
            icon={<Info size={18} color={theme.colors.neutral[600]} />}
            label="App Version"
            type="static"
            rightText={buildNumber ? `${appVersion} (${buildNumber})` : appVersion}
          />
          <SettingsRow
            icon={<FileText size={18} color={theme.colors.neutral[600]} />}
            label="Terms of Service"
            onPress={() => handleOpenURL(URLS.TERMS)}
          />
          <SettingsRow
            icon={<Shield size={18} color={theme.colors.neutral[600]} />}
            label="Privacy Policy"
            onPress={() => handleOpenURL(URLS.PRIVACY)}
            showDivider={false}
          />
          {/* "Licenses" row removed until an OSS-licenses destination exists
              (see PRODUCTION_READINESS.md settings — Manual/flagged); a row that
              only console.log'd on tap was a dead/App-Store-risky control. */}
        </SettingsSection>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: theme.spacing.xl,
    paddingBottom: theme.spacing["4xl"],
  },
});
