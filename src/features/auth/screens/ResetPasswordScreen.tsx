import React, { useState } from "react";
import {
  Alert,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "@providers/AuthProvider/AuthContext";
import { VALIDATION } from "@lib/constants";
import { getAuthErrorMessage } from "@lib/errors";
import { theme } from "@styles/theme";
import { typography } from "@styles/typography";
import Button from "@components/ui/Button";
import { TextField } from "@components/ui";

interface Feedback {
  message: string;
  action?: string;
}

export default function ResetPasswordScreen() {
  const {
    updateRecoveredPassword,
    finishPasswordRecovery,
  } = useAuth();
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Feedback | null>(null);

  const isValid =
    password.length >= VALIDATION.PASSWORD_MIN_LENGTH &&
    password === confirmation;

  const handleSubmit = async () => {
    setError(null);

    if (password.length < VALIDATION.PASSWORD_MIN_LENGTH) {
      setError({
        message: `Password must be at least ${VALIDATION.PASSWORD_MIN_LENGTH} characters`,
        action: "Choose a longer password and try again",
      });
      return;
    }
    if (password !== confirmation) {
      setError({
        message: "Passwords don't match",
        action: "Make sure both password fields are identical",
      });
      return;
    }

    setLoading(true);
    try {
      const result = await updateRecoveredPassword(password);

      if (result.error) {
        setError(getAuthErrorMessage(result.error));
        return;
      }

      Alert.alert(
        "Password updated",
        "Your password has been changed successfully.",
        [
          {
            text: "Continue",
            onPress: () => {
              void finishPasswordRecovery();
            },
          },
        ],
        { cancelable: false }
      );
    } catch (err: unknown) {
      setError(
        getAuthErrorMessage(
          err instanceof Error ? err.message : "Unable to update your password"
        )
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Create a new password</Text>
        <Text style={styles.subtitle}>
          Choose a password you haven&apos;t used for this account before.
        </Text>

        {error && (
          <View
            style={styles.errorBanner}
            accessibilityRole="alert"
            accessibilityLiveRegion="assertive"
          >
            <Text style={styles.errorText}>{error.message}</Text>
            {error.action && (
              <Text style={styles.errorAction}>{error.action}</Text>
            )}
          </View>
        )}

        <TextField
          containerStyle={styles.field}
          placeholder={`New password (${VALIDATION.PASSWORD_MIN_LENGTH}+ characters)`}
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
        <TextField
          containerStyle={styles.field}
          placeholder="Confirm new password"
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

        <Button
          title="Update Password"
          style={styles.submitButton}
          size="lg"
          disabled={!isValid || loading}
          loading={loading}
          onPress={handleSubmit}
          accessibilityLabel="Update password"
        />
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
  field: {
    marginBottom: theme.spacing.lg,
  },
  errorBanner: {
    backgroundColor: theme.colors.errorBg,
    borderColor: theme.colors.errorText,
    borderWidth: 1,
    borderRadius: theme.borderRadius.sm,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.lg,
  },
  errorText: {
    ...typography.body,
    color: theme.colors.error,
  },
  errorAction: {
    ...typography.caption,
    color: theme.colors.error,
    marginTop: theme.spacing.xs,
  },
  submitButton: {
    marginTop: theme.spacing.sm,
  },
});
