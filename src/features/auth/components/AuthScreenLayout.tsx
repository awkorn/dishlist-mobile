import React, { ReactNode } from "react";
import {
  Image,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { theme } from "@styles/theme";
import { typography } from "@styles/typography";

interface AuthScreenLayoutProps {
  title: string;
  children: ReactNode;
  footer: ReactNode;
  extraScrollHeight?: number;
}

export function AuthScreenLayout({
  title,
  children,
  footer,
  extraScrollHeight = 16,
}: AuthScreenLayoutProps) {
  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAwareScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        enableOnAndroid
        extraScrollHeight={extraScrollHeight}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.content}>
          <View style={styles.brand} accessibilityRole="header">
            <Image
              source={require("../../../../assets/images/dishlist-logo.png")}
              style={styles.logo}
              resizeMode="contain"
              accessible={false}
            />
            <Text style={styles.brandName}>DishList</Text>
          </View>

          <View style={styles.intro}>
            <Text style={styles.title}>{title}</Text>
          </View>

          {children}
          {footer}
        </View>
      </KeyboardAwareScrollView>
    </SafeAreaView>
  );
}

export function AuthCard({ children }: { children: ReactNode }) {
  return <View style={styles.card}>{children}</View>;
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: theme.spacing["2xl"],
    paddingTop: theme.spacing.xl,
    paddingBottom: theme.spacing["2xl"],
  },
  content: {
    flex: 1,
    width: "100%",
    maxWidth: 460,
    alignSelf: "center",
    justifyContent: "center",
  },
  brand: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    marginBottom: theme.spacing.lg,
  },
  logo: {
    width: 38,
    height: 38,
  },
  brandName: {
    fontFamily: typography.families.uiBold,
    fontSize: 21,
    lineHeight: 26,
    letterSpacing: -0.4,
    color: theme.colors.textPrimary,
    marginLeft: theme.spacing.sm,
  },
  intro: {
    marginBottom: theme.spacing["2xl"],
  },
  title: {
    fontFamily: typography.families.editorialSemiBold,
    fontSize: 41,
    lineHeight: 45,
    letterSpacing: -1.25,
    color: theme.colors.textPrimary,
  },
  card: {
    padding: theme.spacing.xl,
    borderWidth: 1,
    borderColor: theme.colors.authBorder,
    borderRadius: 24,
    backgroundColor: theme.colors.surface,
    shadowColor: theme.colors.textPrimary,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.07,
    shadowRadius: 28,
    elevation: 2,
  },
});
