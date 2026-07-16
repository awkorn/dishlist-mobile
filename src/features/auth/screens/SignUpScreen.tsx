import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { useAuth } from '@providers/AuthProvider/AuthContext';
import { getAuthErrorMessage } from '@lib/errors';
import { VALIDATION } from '@lib/constants';
import { typography } from '@styles/typography';
import { theme } from '@styles/theme';
import Button from '@components/ui/Button';
import InlineError from '@components/ui/InlineError';
import { TextField } from '@components/ui';
import type { SignUpScreenProps } from '@app-types/navigation';
import {
  AuthCard,
  AuthScreenLayout,
} from '../components/AuthScreenLayout';

type SignUpField = 'firstName' | 'lastName' | 'username' | 'email' | 'password';

interface SignUpError {
  message: string;
  action?: string;
  fields?: Partial<Record<SignUpField, true>>;
  navigateToLogin?: boolean;
}

export default function SignUpScreen({
  navigation,
}: Pick<SignUpScreenProps, 'navigation'>) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<SignUpError | null>(null);
  const { signUp } = useAuth();

  const handleSignUp = async () => {
    setError(null);

    if (!firstName.trim()) {
      setError({
        message: 'First name is required',
        action: 'Please enter your first name',
        fields: { firstName: true },
      });
      return;
    }

    if (!lastName.trim()) {
      setError({
        message: 'Last name is required',
        action: 'Please enter your last name',
        fields: { lastName: true },
      });
      return;
    }

    if (!username.trim()) {
      setError({
        message: 'Username is required',
        action: 'Please choose a username',
        fields: { username: true },
      });
      return;
    }

    if (!email.trim()) {
      setError({
        message: 'Email is required',
        action: 'Please enter your email address',
        fields: { email: true },
      });
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError({
        message: 'Invalid email address',
        action: 'Please enter a valid email',
        fields: { email: true },
      });
      return;
    }

    if (!password.trim()) {
      setError({
        message: 'Password is required',
        action: 'Please create a password',
        fields: { password: true },
      });
      return;
    }

    if (password.length < VALIDATION.PASSWORD_MIN_LENGTH) {
      setError({
        message: 'Password is too short',
        action: `Use at least ${VALIDATION.PASSWORD_MIN_LENGTH} characters`,
        fields: { password: true },
      });
      return;
    }

    setLoading(true);

    try {
      const result = await signUp(email, password, {
        username: username.trim(),
        firstName: firstName.trim(),
        lastName: lastName.trim(),
      });

      if (result.error) {
        const errorInfo = getAuthErrorMessage(result.error);
        const fields = errorInfo.field
          ? { [errorInfo.field]: true }
          : undefined;
        setError({
          message: errorInfo.message,
          action: errorInfo.action,
          fields,
          navigateToLogin:
            errorInfo.message === 'An account with this email already exists',
        });
      } else if (result.requiresEmailConfirmation) {
        Alert.alert(
          "Check your email",
          "We sent you a confirmation link. Open it on this device to finish creating your account.",
          [{ text: "OK", onPress: () => navigation.navigate("Login") }]
        );
      }
    } catch (err) {
      setError({
        message: 'Something went wrong',
        action: 'Please try again',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthScreenLayout
      eyebrow="Collect · Collaborate · Discover"
      title="Start your collection."
      description="Bring together the recipes, notes, and people you never want to lose."
      extraScrollHeight={24}
      footer={
        <View style={styles.footer}>
          <Text style={styles.footerText}>Already have an account? </Text>
          <TouchableOpacity
            onPress={() => navigation.navigate('Login')}
            disabled={loading}
            testID="login-link"
            accessibilityRole="button"
            accessibilityState={{ disabled: loading }}
            hitSlop={8}
          >
            <Text style={styles.linkText}>Login</Text>
          </TouchableOpacity>
        </View>
      }
    >
      <AuthCard>
        {error && (
          <InlineError
            message={error.message}
            action={
              error.navigateToLogin ? 'Go to Login' : error.action
            }
            onActionPress={
              error.navigateToLogin
                ? () => navigation.navigate('Login')
                : undefined
            }
          />
        )}

        <View>
          <View style={styles.nameRow}>
            <TextField
              containerStyle={[styles.field, styles.nameField]}
              inputContainerStyle={styles.input}
              label="First name"
              invalid={Boolean(error?.fields?.firstName)}
              placeholder="First Name"
              placeholderTextColor={theme.colors.neutral[400]}
              value={firstName}
              onChangeText={(text) => {
                setFirstName(text);
                setError(null);
              }}
              autoCapitalize="words"
              autoComplete="given-name"
              editable={!loading}
              testID="firstName-input"
            />

            <TextField
              containerStyle={[styles.field, styles.nameField]}
              inputContainerStyle={styles.input}
              label="Last name"
              invalid={Boolean(error?.fields?.lastName)}
              placeholder="Last Name"
              placeholderTextColor={theme.colors.neutral[400]}
              value={lastName}
              onChangeText={(text) => {
                setLastName(text);
                setError(null);
              }}
              autoCapitalize="words"
              autoComplete="family-name"
              editable={!loading}
              testID="lastName-input"
            />
          </View>

          <TextField
            containerStyle={styles.field}
            inputContainerStyle={styles.input}
            label="Username"
            invalid={Boolean(error?.fields?.username)}
            placeholder="Username"
            placeholderTextColor={theme.colors.neutral[400]}
            value={username}
            onChangeText={(text) => {
              setUsername(text);
              setError(null);
            }}
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="username-new"
            editable={!loading}
            testID="username-input"
          />

          <TextField
            containerStyle={styles.field}
            inputContainerStyle={styles.input}
            label="Email address"
            invalid={Boolean(error?.fields?.email)}
            placeholder="Email"
            placeholderTextColor={theme.colors.neutral[400]}
            value={email}
            onChangeText={(text) => {
              setEmail(text);
              setError(null);
            }}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="email"
            editable={!loading}
            testID="email-input"
          />

          <TextField
            containerStyle={styles.field}
            inputContainerStyle={styles.input}
            label="Password"
            invalid={Boolean(error?.fields?.password)}
            placeholder="Password"
            placeholderTextColor={theme.colors.neutral[400]}
            value={password}
            onChangeText={(text) => {
              setPassword(text);
              setError(null);
            }}
            secureTextEntry
            autoComplete="password-new"
            editable={!loading}
            testID="password-input"
            helperText={`Use at least ${VALIDATION.PASSWORD_MIN_LENGTH} characters`}
          />

          <Button
            title="Sign Up"
            onPress={handleSignUp}
            loading={loading}
            disabled={loading}
            variant="secondary"
            size="lg"
            style={styles.signUpButton}
          />
        </View>
      </AuthCard>
    </AuthScreenLayout>
  );
}

const styles = StyleSheet.create({
  nameRow: {
    flexDirection: 'row',
    gap: theme.spacing.md,
  },
  field: {
    marginBottom: theme.spacing.lg,
  },
  nameField: {
    flex: 1,
  },
  input: {
    minHeight: 54,
    borderRadius: theme.borderRadius.lg,
  },
  signUpButton: {
    marginTop: theme.spacing.xs,
    borderRadius: 26,
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
