import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
} from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { useAuth } from '@providers/AuthProvider/AuthContext';
import { getAuthErrorMessage } from '@lib/errors';
import { typography } from '@styles/typography';
import { theme } from '@styles/theme';
import Button from '@components/ui/Button';
import InlineError from '@components/ui/InlineError';
import { TextField } from '@components/ui';
import type { LoginScreenProps } from '@app-types/navigation';

type LoginField = 'email' | 'password';

interface Feedback {
  message: string;
  action?: string;
  fields?: Partial<Record<LoginField, true>>;
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function LoginScreen({
  navigation,
}: Pick<LoginScreenProps, 'navigation'>) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [error, setError] = useState<Feedback | null>(null);
  const [success, setSuccess] = useState<Feedback | null>(null);
  const {
    signIn,
    resetPassword,
    authFlowError,
    clearAuthFlowError,
  } = useAuth();
  const displayedError: Feedback | null =
    error ?? (authFlowError ? { message: authFlowError } : null);
  const isBusy = loginLoading || resetLoading;

  const handleLogin = async () => {
    setError(null);
    setSuccess(null);
    clearAuthFlowError();

    if (!email.trim()) {
      setError({
        message: 'Email is required',
        action: 'Please enter your email address',
        fields: { email: true },
      });
      return;
    }

    if (!password.trim()) {
      setError({
        message: 'Password is required',
        action: 'Please enter your password',
        fields: { password: true },
      });
      return;
    }

    setLoginLoading(true);

    try {
      const result = await signIn(email.trim().toLowerCase(), password);

      if (result.error) {
        const errorInfo = getAuthErrorMessage(result.error);
        setError({ ...errorInfo, fields: { email: true, password: true } });
      }
    } catch (err: unknown) {
      setError({
        ...getAuthErrorMessage(
          err instanceof Error ? err.message : 'Unable to sign in'
        ),
        fields: { email: true, password: true },
      });
    } finally {
      setLoginLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    const normalizedEmail = email.trim().toLowerCase();
    setError(null);
    setSuccess(null);
    clearAuthFlowError();

    if (!normalizedEmail) {
      setError({
        message: "Enter your email first",
        action: "Type your email above, then tap forgot password",
        fields: { email: true },
      });
      return;
    }

    if (!EMAIL_PATTERN.test(normalizedEmail)) {
      setError({
        message: "Enter a valid email address",
        action: "Check the address for typos and try again",
        fields: { email: true },
      });
      return;
    }

    setResetLoading(true);
    try {
      const result = await resetPassword(normalizedEmail);
      if (result.error) {
        const errorInfo = getAuthErrorMessage(result.error);
        setError(errorInfo);
      } else {
        setSuccess({
          message: "Check your inbox",
          action:
            "If an account exists for this email, you'll receive a password reset link shortly.",
        });
      }
    } catch (err: unknown) {
      setError(
        getAuthErrorMessage(
          err instanceof Error ? err.message : "Unable to send reset email"
        )
      );
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <KeyboardAwareScrollView
      contentContainerStyle={styles.container}
      enableOnAndroid={true}
      extraScrollHeight={10}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.content}>
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <Image
              source={require('../../../../assets/images/dishlist-logo.png')}
              style={styles.logo}
              resizeMode="contain"
            />
          </View>
          <Text style={styles.title}>DishList</Text>
        </View>

        {displayedError && (
          <InlineError
            message={displayedError.message}
            action={displayedError.action}
          />
        )}

        {success && (
          <View
            style={styles.successBanner}
            accessibilityRole="alert"
            accessibilityLiveRegion="polite"
          >
            <Text style={styles.successTitle}>{success.message}</Text>
            {success.action && (
              <Text style={styles.successText}>{success.action}</Text>
            )}
          </View>
        )}

        <View style={styles.form}>
          <TextField
            containerStyle={styles.field}
            invalid={Boolean(error?.fields?.email)}
            placeholder="Email"
            value={email}
            onChangeText={(text) => {
              setEmail(text);
              setError(null);
              setSuccess(null);
              clearAuthFlowError();
            }}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="email"
            editable={!isBusy}
            testID="email-input"
          />

          <TextField
            containerStyle={styles.field}
            invalid={Boolean(error?.fields?.password)}
            placeholder="Password"
            value={password}
            onChangeText={(text) => {
              setPassword(text);
              setError(null);
              setSuccess(null);
              clearAuthFlowError();
            }}
            secureTextEntry
            autoComplete="password"
            editable={!isBusy}
            testID="password-input"
          />

          <Button
            title="Login"
            onPress={handleLogin}
            loading={loginLoading}
            disabled={isBusy}
            style={styles.loginButton}
          />

          <TouchableOpacity
            onPress={handleForgotPassword}
            style={styles.forgotPassword}
            disabled={isBusy}
            accessibilityRole="button"
            accessibilityState={{ disabled: isBusy, busy: resetLoading }}
          >
            <Text style={styles.forgotPasswordText}>
              {resetLoading ? 'Sending reset email…' : 'Forgot password?'}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>New user? </Text>
          <TouchableOpacity
            onPress={() => navigation.navigate('SignUp')}
            disabled={isBusy}
            testID="signup-link"
            accessibilityRole="button"
            accessibilityState={{ disabled: isBusy }}
          >
            <Text style={styles.linkText}>Sign up</Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAwareScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: theme.colors.background,
    justifyContent: 'center',
    paddingHorizontal: theme.spacing['4xl'],
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    marginTop: -150,
  },
  header: {
    alignItems: 'center',
    marginBottom: theme.spacing['4xl'],
  },
  logoContainer: {
    marginBottom: 15,
  },
  logo: {
    height: 80,
  },
  title: {
    ...typography.heading1,
    color: theme.colors.textPrimary,
  },
  form: {
    marginBottom: theme.spacing['3xl'],
  },
  successBanner: {
    backgroundColor: theme.colors.successBg,
    borderRadius: theme.borderRadius.sm,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.lg,
  },
  successTitle: {
    ...typography.label,
    fontSize: 16,
    color: theme.colors.successText,
  },
  successText: {
    ...typography.caption,
    color: theme.colors.successText,
    marginTop: theme.spacing.xs,
  },
  field: {
    marginBottom: theme.spacing.lg,
  },
  loginButton: {
    marginTop: theme.spacing.sm,
  },
  forgotPassword: {
    alignItems: 'center',
    marginTop: theme.spacing.lg,
  },
  forgotPasswordText: {
    ...typography.body,
    color: theme.colors.primary[500],
    fontSize: 14,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  footerText: {
    ...typography.body,
    color: theme.colors.neutral[500],
  },
  linkText: {
    fontFamily: typography.families.uiSemiBold,
    color: theme.colors.primary[500],
  },
});
