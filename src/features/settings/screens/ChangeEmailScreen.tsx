import React, { useState, useCallback, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Alert,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ArrowLeft, Eye, EyeOff, Mail, CheckCircle } from "lucide-react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { RootStackParamList } from "@app-types/navigation";
import { changeEmail } from "@features/auth/services/authService";
import { useAuth } from "@providers/AuthProvider/AuthContext";
import { getAuthErrorMessage } from "@lib/errors";
import { theme } from "@styles/theme";
import { typography } from "@styles/typography";

type Props = NativeStackScreenProps<RootStackParamList, "ChangeEmail">;

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function ChangeEmailScreen({ navigation }: Props) {
  const { user } = useAuth();
  const [password, setPassword] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const emailRef = useRef<TextInput>(null);
  const passwordRef = useRef<TextInput>(null);

  const isValidEmail = EMAIL_REGEX.test(newEmail.trim());
  const isSameEmail =
    newEmail.trim().toLowerCase() === (user?.email ?? "").toLowerCase();
  const isValid = password.length > 0 && isValidEmail && !isSameEmail;

  const handleSubmit = useCallback(async () => {
    setError(null);

    if (!password) {
      setError("Please enter your password");
      return;
    }
    if (!isValidEmail) {
      setError("Please enter a valid email address");
      return;
    }
    if (isSameEmail) {
      setError("New email must be different from your current email");
      return;
    }

    setLoading(true);
    try {
      const result = await changeEmail(password, newEmail.trim().toLowerCase());

      if (result.error) {
        const mapped = getAuthErrorMessage(result.error);
        setError(mapped.message);
        return;
      }

      setSubmitted(true);
    } catch (err: any) {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [password, newEmail, isValidEmail, isSameEmail]);

  // ── Success State ─────────────────────────────────────
  if (submitted) {
    return (
      <SafeAreaView style={styles.container} edges={["top"]}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <ArrowLeft size={24} color={theme.colors.neutral[800]} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Change Email</Text>
          <View style={styles.headerSpacer} />
        </View>

        <View style={styles.successContainer}>
          <View style={styles.successIcon}>
            <CheckCircle size={48} color={theme.colors.primary[500]} />
          </View>
          <Text style={styles.successTitle}>Check your inbox</Text>
          <Text style={styles.successMessage}>
            We sent a confirmation link to{"\n"}
            <Text style={styles.successEmail}>{newEmail.trim().toLowerCase()}</Text>
          </Text>
          <Text style={styles.successHint}>
            Your email will be updated once you confirm the link. If you don't
            see it, check your spam folder.
          </Text>
          <TouchableOpacity
            style={styles.doneButton}
            onPress={() => navigation.goBack()}
            activeOpacity={0.8}
          >
            <Text style={styles.doneButtonText}>Done</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // ── Form State ────────────────────────────────────────
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
        <Text style={styles.headerTitle}>Change Email</Text>
        <View style={styles.headerSpacer} />
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          style={styles.flex}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Current Email Display */}
          <View style={styles.currentEmailContainer}>
            <Text style={styles.currentEmailLabel}>Current email</Text>
            <Text style={styles.currentEmailValue}>{user?.email ?? ""}</Text>
          </View>

          {/* Error Banner */}
          {error && (
            <View style={styles.errorBanner}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          {/* New Email Field */}
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>New Email</Text>
            <View style={styles.inputWrapper}>
              <TextInput
                ref={emailRef}
                style={styles.input}
                value={newEmail}
                onChangeText={(text) => {
                  setNewEmail(text);
                  setError(null);
                }}
                placeholder="Enter new email address"
                placeholderTextColor={theme.colors.neutral[400]}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="email"
                editable={!loading}
                returnKeyType="next"
                onSubmitEditing={() => passwordRef.current?.focus()}
              />
              <View style={styles.iconRight}>
                <Mail size={20} color={theme.colors.neutral[400]} />
              </View>
            </View>
          </View>

          {/* Same email hint */}
          {isSameEmail && newEmail.length > 0 && (
            <Text style={styles.hint}>
              This is already your current email
            </Text>
          )}

          {/* Password Field */}
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>Confirm Password</Text>
            <View style={styles.inputWrapper}>
              <TextInput
                ref={passwordRef}
                style={styles.input}
                value={password}
                onChangeText={(text) => {
                  setPassword(text);
                  setError(null);
                }}
                placeholder="Enter your password"
                placeholderTextColor={theme.colors.neutral[400]}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="password"
                editable={!loading}
                returnKeyType="done"
                onSubmitEditing={isValid ? handleSubmit : undefined}
              />
              <TouchableOpacity
                style={styles.eyeButton}
                onPress={() => setShowPassword((prev) => !prev)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                {showPassword ? (
                  <EyeOff size={20} color={theme.colors.neutral[400]} />
                ) : (
                  <Eye size={20} color={theme.colors.neutral[400]} />
                )}
              </TouchableOpacity>
            </View>
          </View>

          {/* Submit Button */}
          <TouchableOpacity
            style={[styles.button, !isValid && styles.buttonDisabled]}
            onPress={handleSubmit}
            disabled={!isValid || loading}
            activeOpacity={0.8}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Update Email</Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  flex: {
    flex: 1,
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
  scrollContent: {
    padding: theme.spacing.xl,
    paddingBottom: theme.spacing["4xl"],
  },
  currentEmailContainer: {
    backgroundColor: theme.colors.neutral[50],
    borderRadius: 12,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.xl,
  },
  currentEmailLabel: {
    ...typography.caption,
    color: theme.colors.neutral[500],
    marginBottom: 4,
  },
  currentEmailValue: {
    ...typography.body,
    color: theme.colors.textPrimary,
    fontWeight: "500",
  },
  fieldContainer: {
    marginBottom: theme.spacing.lg,
  },
  label: {
    ...typography.body,
    fontWeight: "600",
    color: theme.colors.neutral[700],
    marginBottom: theme.spacing.sm,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.neutral[200],
  },
  input: {
    flex: 1,
    ...typography.body,
    color: theme.colors.textPrimary,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
  },
  iconRight: {
    paddingHorizontal: theme.spacing.md,
  },
  eyeButton: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
  },
  errorBanner: {
    backgroundColor: theme.colors.error + "15",
    borderRadius: 12,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.lg,
    borderWidth: 1,
    borderColor: theme.colors.error + "30",
  },
  errorText: {
    ...typography.body,
    color: theme.colors.error,
    fontSize: 14,
  },
  hint: {
    ...typography.caption,
    color: theme.colors.neutral[500],
    marginTop: -theme.spacing.sm,
    marginBottom: theme.spacing.lg,
  },
  button: {
    backgroundColor: theme.colors.primary[500],
    borderRadius: 12,
    paddingVertical: theme.spacing.md,
    alignItems: "center",
    justifyContent: "center",
    marginTop: theme.spacing.lg,
    height: 50,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    ...typography.body,
    fontWeight: "600",
    color: "#fff",
    fontSize: 16,
  },
  // Success state
  successContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: theme.spacing.xl,
    paddingBottom: 80,
  },
  successIcon: {
    marginBottom: theme.spacing.xl,
  },
  successTitle: {
    ...typography.heading3,
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.md,
  },
  successMessage: {
    ...typography.body,
    color: theme.colors.neutral[600],
    textAlign: "center",
    lineHeight: 22,
    marginBottom: theme.spacing.sm,
  },
  successEmail: {
    fontWeight: "600",
    color: theme.colors.textPrimary,
  },
  successHint: {
    ...typography.caption,
    color: theme.colors.neutral[400],
    textAlign: "center",
    lineHeight: 18,
    marginBottom: theme.spacing["2xl"],
    paddingHorizontal: theme.spacing.xl,
  },
  doneButton: {
    backgroundColor: theme.colors.primary[500],
    borderRadius: 12,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing["4xl"],
    alignItems: "center",
  },
  doneButtonText: {
    ...typography.body,
    fontWeight: "600",
    color: "#fff",
    fontSize: 16,
  },
});