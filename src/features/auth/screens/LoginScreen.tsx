import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { useAuth } from '@providers/AuthProvider/AuthContext';
import { getAuthErrorMessage } from '@lib/errors';
import { typography } from '@styles/typography';
import { theme } from '@styles/theme';
import Button from '@components/ui/Button';
import InlineError from '@components/ui/InlineError';
import { TextField } from '@components/ui';
import type { LoginScreenProps } from '@app-types/navigation';
import {
  AuthCard,
  AuthScreenLayout,
} from '../components/AuthScreenLayout';

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
    <AuthScreenLayout
      eyebrow="Collect · Collaborate · Discover"
      title="Welcome back."
      description="Keep the recipes worth passing down—and the stories that belong with them."
      footer={
        <View style={styles.footer}>
          <Text style={styles.footerText}>New to DishList? </Text>
          <TouchableOpacity
            onPress={() => navigation.navigate('SignUp')}
            disabled={isBusy}
            testID="signup-link"
            accessibilityRole="button"
            accessibilityState={{ disabled: isBusy }}
            hitSlop={8}
          >
            <Text style={styles.linkText}>Sign up</Text>
          </TouchableOpacity>
        </View>
      }
    >
      <AuthCard>
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

        <View>
          <TextField
            containerStyle={styles.field}
            inputContainerStyle={styles.input}
            label="Email address"
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
            inputContainerStyle={styles.input}
            label="Password"
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

          <TouchableOpacity
            onPress={handleForgotPassword}
            style={styles.forgotPassword}
            disabled={isBusy}
            accessibilityRole="button"
            accessibilityState={{ disabled: isBusy, busy: resetLoading }}
            hitSlop={8}
          >
            <Text style={styles.forgotPasswordText}>
              {resetLoading ? 'Sending reset email…' : 'Forgot password?'}
            </Text>
          </TouchableOpacity>

          <Button
            title="Login"
            onPress={handleLogin}
            loading={loginLoading}
            disabled={isBusy}
            variant="secondary"
            size="lg"
            style={styles.loginButton}
          />
        </View>
      </AuthCard>
    </AuthScreenLayout>
  );
}

const styles = StyleSheet.create({
  successBanner: {
    backgroundColor: theme.colors.successBg,
    borderRadius: theme.borderRadius.lg,
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
  input: {
    minHeight: 54,
    borderRadius: theme.borderRadius.lg,
  },
  loginButton: {
    borderRadius: 26,
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginTop: -theme.spacing.xs,
    marginBottom: theme.spacing.xl,
  },
  forgotPasswordText: {
    ...typography.label,
    color: theme.colors.textPrimary,
    fontSize: 14,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: theme.spacing['2xl'],
  },
  footerText: {
    ...typography.body,
    color: theme.colors.neutral[600],
  },
  linkText: {
    fontFamily: typography.families.uiSemiBold,
    fontSize: 16,
    color: theme.colors.textPrimary,
  },
});
