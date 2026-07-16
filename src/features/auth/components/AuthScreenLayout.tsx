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
  eyebrow: string;
  title: string;
  description: string;
  children: ReactNode;
  footer: ReactNode;
  extraScrollHeight?: number;
}

export function AuthScreenLayout({
  eyebrow,
  title,
  description,
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
            <View style={styles.eyebrowRow}>
              <Text style={styles.eyebrowStar} accessibilityElementsHidden>
                ✦
              </Text>
              <Text style={styles.eyebrow}>{eyebrow}</Text>
            </View>
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.description}>{description}</Text>
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
    marginBottom: theme.spacing["3xl"],
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
  eyebrowRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: theme.spacing.md,
  },
  eyebrowStar: {
    fontFamily: typography.families.uiBold,
    fontSize: 13,
    color: theme.colors.recipeAccent,
    marginRight: theme.spacing.sm,
  },
  eyebrow: {
    fontFamily: typography.families.uiBold,
    fontSize: 11,
    lineHeight: 16,
    letterSpacing: 1.25,
    textTransform: "uppercase",
    color: theme.colors.primary[600],
  },
  title: {
    fontFamily: typography.families.editorialSemiBold,
    fontSize: 41,
    lineHeight: 45,
    letterSpacing: -1.25,
    color: theme.colors.textPrimary,
  },
  description: {
    ...typography.body,
    maxWidth: 350,
    color: theme.colors.neutral[600],
    marginTop: theme.spacing.md,
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
