import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  Alert,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ChevronLeft, Eye, EyeOff } from "lucide-react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { RootStackParamList } from "@app-types/navigation";
import { changePassword } from "@features/auth/services/authService";
import { getAuthErrorMessage } from "@lib/errors";
import { theme } from "@styles/theme";
import { typography } from "@styles/typography";
import { ScreenHeader, ScreenHeaderAction, TextField } from "@components/ui";
import Button from "@components/ui/Button";

type Props = NativeStackScreenProps<RootStackParamList, "ChangePassword">;

const MIN_PASSWORD_LENGTH = 6;

export default function ChangePasswordScreen({ navigation }: Props) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Visibility toggles
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const isValid =
    currentPassword.length > 0 &&
    newPassword.length >= MIN_PASSWORD_LENGTH &&
    newPassword === confirmPassword;

  const handleChangePassword = useCallback(async () => {
    setError(null);

    // Client-side validation
    if (!currentPassword) {
      setError("Please enter your current password");
      return;
    }
    if (newPassword.length < MIN_PASSWORD_LENGTH) {
      setError(
        `New password must be at least ${MIN_PASSWORD_LENGTH} characters`,
      );
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("New passwords don't match");
      return;
    }
    if (currentPassword === newPassword) {
      setError("New password must be different from current password");
      return;
    }

    setLoading(true);
    try {
      const result = await changePassword(currentPassword, newPassword);

      if (result.error) {
        const mapped = getAuthErrorMessage(result.error);
        setError(mapped.message);
        return;
      }

      Alert.alert(
        "Password Changed",
        "Your password has been updated successfully.",
        [{ text: "OK", onPress: () => navigation.goBack() }],
      );
    } catch (err: any) {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [currentPassword, newPassword, confirmPassword, navigation]);

  const renderPasswordField = (
    label: string,
    value: string,
    onChangeText: (text: string) => void,
    show: boolean,
    toggleShow: () => void,
    placeholder: string,
    autoComplete: "password" | "password-new" = "password",
  ) => (
    <TextField
      containerStyle={styles.fieldContainer}
      label={label}
      value={value}
      onChangeText={(text) => {
        onChangeText(text);
        setError(null);
      }}
      placeholder={placeholder}
      secureTextEntry={!show}
      autoCapitalize="none"
      autoCorrect={false}
      autoComplete={autoComplete}
      editable={!loading}
      rightElement={
        <TouchableOpacity
          style={styles.eyeButton}
          onPress={toggleShow}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          accessibilityRole="button"
          accessibilityLabel={show ? "Hide password" : "Show password"}
        >
          {show ? (
            <EyeOff size={20} color={theme.colors.neutral[400]} />
          ) : (
            <Eye size={20} color={theme.colors.neutral[400]} />
          )}
        </TouchableOpacity>
      }
    />
  );

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <ScreenHeader
        title="Change Password"
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
          {/* Error Banner */}
          {error && (
            <View style={styles.errorBanner}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          {renderPasswordField(
            "Current Password",
            currentPassword,
            setCurrentPassword,
            showCurrent,
            () => setShowCurrent((prev) => !prev),
            "Enter current password",
          )}

          {renderPasswordField(
            "New Password",
            newPassword,
            setNewPassword,
            showNew,
            () => setShowNew((prev) => !prev),
            `At least ${MIN_PASSWORD_LENGTH} characters`,
            "password-new",
          )}

          {renderPasswordField(
            "Confirm New Password",
            confirmPassword,
            setConfirmPassword,
            showConfirm,
            () => setShowConfirm((prev) => !prev),
            "Re-enter new password",
            "password-new",
          )}

          {/* Hint */}
          {newPassword.length > 0 && newPassword.length < MIN_PASSWORD_LENGTH && (
            <Text style={styles.hint}>
              Password must be at least {MIN_PASSWORD_LENGTH} characters
            </Text>
          )}

          {/* Submit Button */}
          <Button
            title="Update Password"
            style={styles.submitButton}
            size="lg"
            onPress={handleChangePassword}
            disabled={!isValid || loading}
            loading={loading}
          />
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
  scrollContent: {
    padding: theme.spacing.xl,
    paddingBottom: theme.spacing["4xl"],
  },
  fieldContainer: {
    marginBottom: theme.spacing.lg,
  },
  eyeButton: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
  },
  errorBanner: {
    backgroundColor: theme.colors.errorBg,
    borderRadius: 12,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.lg,
    borderWidth: 1,
    borderColor: theme.colors.errorText,
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
  submitButton: {
    marginTop: theme.spacing.lg,
  },
});
