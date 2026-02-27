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
import { ArrowLeft } from "lucide-react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { RootStackParamList } from "@app-types/navigation";
import {
  Mail,
  Lock,
  Link as LinkIcon,
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
  Scale,
} from "lucide-react-native";
import { useAuth } from "@providers/AuthProvider/AuthContext";
import { SettingsSection, SettingsRow } from "../components";
import { theme } from "@styles/theme";
import { typography } from "@styles/typography";
import Constants from "expo-constants";

type Props = NativeStackScreenProps<RootStackParamList, "Settings">;

// TODO: Replace with your actual URLs
const URLS = {
  TERMS: "https://dishlist.app/terms",
  PRIVACY: "https://dishlist.app/privacy",
  FAQ: "https://dishlist.app/faq",
  // App Store URL - update with your actual app ID
  APP_STORE: "https://apps.apple.com/app/idYOUR_APP_ID",
};

const SUPPORT_EMAIL = "support@dishlist.app";

export default function SettingsScreen({ navigation }: Props) {
  const { signOut, user } = useAuth();
  const [pushEnabled, setPushEnabled] = useState(true);

  const appVersion =
    Constants.expoConfig?.version ?? Constants.manifest?.version ?? "1.0.0";
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
          await signOut();
        },
      },
    ]);
  }, [signOut]);

  const handleDeleteAccount = useCallback(() => {
    Alert.alert(
      "Delete Account",
      "This will permanently delete your account and all your data. This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete Account",
          style: "destructive",
          onPress: () => {
            // TODO: Implement account deletion API call
            console.log("Delete account confirmed");
          },
        },
      ]
    );
  }, []);

  const handleContactSupport = useCallback(() => {
    const subject = encodeURIComponent("DishList Support Request");
    const body = encodeURIComponent(
      `\n\n---\nApp Version: ${appVersion} (${buildNumber})\nUser: ${user?.email ?? "N/A"}`
    );
    Linking.openURL(`mailto:${SUPPORT_EMAIL}?subject=${subject}&body=${body}`);
  }, [appVersion, buildNumber, user?.email]);

  const handleOpenURL = useCallback((url: string) => {
    Linking.openURL(url);
  }, []);

  const handleRateApp = useCallback(() => {
    Linking.openURL(URLS.APP_STORE);
  }, []);

  const handlePushToggle = useCallback((value: boolean) => {
    setPushEnabled(value);
    // TODO: Register/unregister push token with backend
  }, []);

  // ── Render ────────────────────────────────────────────────

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <ArrowLeft size={24} color={theme.colors.neutral[800]} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Settings</Text>
        <View style={styles.headerSpacer} />
      </View>

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
            onPress={() => {
              // TODO: Navigate to change email screen
              console.log("Change email");
            }}
          />
          <SettingsRow
            icon={<Lock size={18} color={theme.colors.neutral[600]} />}
            label="Change Password"
            onPress={() => {
              // TODO: Navigate to change password screen
              console.log("Change password");
            }}
          />
          <SettingsRow
            icon={<LinkIcon size={18} color={theme.colors.neutral[600]} />}
            label="Linked Accounts"
            onPress={() => {
              // TODO: Navigate to linked accounts screen
              console.log("Linked accounts");
            }}
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
          />
        </SettingsSection>

        {/* ── Subscription ──────────────────────────────────── */}
        <SettingsSection title="Subscription">
          <SettingsRow
            icon={<Crown size={18} color={theme.colors.neutral[600]} />}
            label="Manage Subscription"
            subtitle="Free plan"
            onPress={() => {
              // TODO: Navigate to subscription/paywall screen (RevenueCat)
              console.log("Manage subscription");
            }}
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
            label="Help & FAQ"
            onPress={() => handleOpenURL(URLS.FAQ)}
          />
          <SettingsRow
            icon={
              <MessageSquare size={18} color={theme.colors.neutral[600]} />
            }
            label="Contact Support"
            onPress={handleContactSupport}
          />
          <SettingsRow
            icon={<Flag size={18} color={theme.colors.neutral[600]} />}
            label="Report a Problem"
            onPress={handleContactSupport}
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
          />
          <SettingsRow
            icon={<Scale size={18} color={theme.colors.neutral[600]} />}
            label="Licenses"
            onPress={() => {
              // TODO: Navigate to licenses screen or open URL
              console.log("Licenses");
            }}
            showDivider={false}
          />
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
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.md,
    backgroundColor: theme.colors.background,
  },
  headerTitle: {
    ...typography.heading3,
    fontSize: 20,
    color: theme.colors.textPrimary,
  },
  headerSpacer: {
    width: 24,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: theme.spacing.xl,
    paddingBottom: theme.spacing["4xl"],
  },
});