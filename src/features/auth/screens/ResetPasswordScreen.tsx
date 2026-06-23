import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "@providers/AuthProvider/AuthContext";
import { VALIDATION } from "@lib/constants";
import { getAuthErrorMessage } from "@lib/errors";
import { theme } from "@styles/theme";
import { typography } from "@styles/typography";

export default function ResetPasswordScreen() {
  const {
    updateRecoveredPassword,
    finishPasswordRecovery,
  } = useAuth();
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isValid =
    password.length >= VALIDATION.PASSWORD_MIN_LENGTH &&
    password === confirmation;

  const handleSubmit = async () => {
    setError(null);

    if (password.length < VALIDATION.PASSWORD_MIN_LENGTH) {
      setError(
        `Password must be at least ${VALIDATION.PASSWORD_MIN_LENGTH} characters`
      );
      return;
    }
    if (password !== confirmation) {
      setError("Passwords don't match");
      return;
    }

    setLoading(true);
    const result = await updateRecoveredPassword(password);
    setLoading(false);

    if (result.error) {
      setError(getAuthErrorMessage(result.error).message);
      return;
    }

    Alert.alert(
      "Password updated",
      "Your password has been changed successfully.",
      [{ text: "Continue", onPress: finishPasswordRecovery }]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Create a new password</Text>
        <Text style={styles.subtitle}>
          Choose a password you haven&apos;t used for this account before.
        </Text>

        {error && (
          <View style={styles.errorBanner}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        <TextInput
          style={styles.input}
          placeholder={`New password (${VALIDATION.PASSWORD_MIN_LENGTH}+ characters)`}
          placeholderTextColor={theme.colors.neutral[400]}
          value={password}
          onChangeText={(value) => {
            setPassword(value);
            setError(null);
          }}
          secureTextEntry
          autoCapitalize="none"
          autoCorrect={false}
          autoComplete="password-new"
          editable={!loading}
          accessibilityLabel="New password"
        />
        <TextInput
          style={styles.input}
          placeholder="Confirm new password"
          placeholderTextColor={theme.colors.neutral[400]}
          value={confirmation}
          onChangeText={(value) => {
            setConfirmation(value);
            setError(null);
          }}
          secureTextEntry
          autoCapitalize="none"
          autoCorrect={false}
          autoComplete="password-new"
          editable={!loading}
          onSubmitEditing={isValid ? handleSubmit : undefined}
          accessibilityLabel="Confirm new password"
        />

        <TouchableOpacity
          style={[styles.button, !isValid && styles.buttonDisabled]}
          disabled={!isValid || loading}
          onPress={handleSubmit}
          accessibilityRole="button"
          accessibilityLabel="Update password"
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Update Password</Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  content: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: theme.spacing["4xl"],
  },
  title: {
    ...typography.heading3,
    color: theme.colors.textPrimary,
    textAlign: "center",
    marginBottom: theme.spacing.md,
  },
  subtitle: {
    ...typography.body,
    color: theme.colors.neutral[500],
    textAlign: "center",
    marginBottom: theme.spacing["3xl"],
  },
  input: {
    borderWidth: 1,
    borderColor: theme.colors.neutral[300],
    borderRadius: theme.borderRadius.sm,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
    fontSize: 16,
    backgroundColor: theme.colors.surface,
    color: theme.colors.neutral[800],
  },
  errorBanner: {
    backgroundColor: theme.colors.error + "15",
    borderColor: theme.colors.error + "30",
    borderWidth: 1,
    borderRadius: theme.borderRadius.sm,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.lg,
  },
  errorText: {
    ...typography.body,
    color: theme.colors.error,
  },
  button: {
    height: 50,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: theme.borderRadius.sm,
    backgroundColor: theme.colors.primary[500],
    marginTop: theme.spacing.sm,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    ...typography.body,
    color: "#fff",
    fontWeight: "600",
  },
});
