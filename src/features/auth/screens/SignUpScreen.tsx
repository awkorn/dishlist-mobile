import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { useAuth } from '@providers/AuthProvider/AuthContext';
import { getAuthErrorMessage } from '@lib/errors';
import { VALIDATION } from '@lib/constants';
import { typography } from '@styles/typography';
import { theme } from '@styles/theme';
import Button from '@components/ui/Button';
import InlineError from '@components/ui/InlineError';
import { TextField } from '@components/ui';

interface SignUpScreenProps {
  navigation: any;
}

type SignUpField = 'firstName' | 'lastName' | 'username' | 'email' | 'password';

interface SignUpError {
  message: string;
  action?: string;
  fields?: Partial<Record<SignUpField, true>>;
  navigateToLogin?: boolean;
}

export default function SignUpScreen({ navigation }: SignUpScreenProps) {
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
    <KeyboardAwareScrollView
      contentContainerStyle={styles.container}
      enableOnAndroid={true}
      extraScrollHeight={20}
    >
      <View style={styles.content}>
        <Text style={styles.title}>Create Account</Text>

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

        <View style={styles.form}>
          <TextField
            containerStyle={styles.field}
            invalid={Boolean(error?.fields?.firstName)}
            placeholder="First Name"
            placeholderTextColor={theme.colors.neutral[400]}
            value={firstName}
            onChangeText={(text) => {
              setFirstName(text);
              setError(null);
            }}
            autoCapitalize="words"
            editable={!loading}
            testID="firstName-input"
          />

          <TextField
            containerStyle={styles.field}
            invalid={Boolean(error?.fields?.lastName)}
            placeholder="Last Name"
            placeholderTextColor={theme.colors.neutral[400]}
            value={lastName}
            onChangeText={(text) => {
              setLastName(text);
              setError(null);
            }}
            autoCapitalize="words"
            editable={!loading}
            testID="lastName-input"
          />

          <TextField
            containerStyle={styles.field}
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
            editable={!loading}
            testID="username-input"
          />

          <TextField
            containerStyle={styles.field}
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
            invalid={Boolean(error?.fields?.password)}
            placeholder={`Password (min ${VALIDATION.PASSWORD_MIN_LENGTH} characters)`}
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
          />

          <Button
            title="Sign Up"
            onPress={handleSignUp}
            loading={loading}
            disabled={loading}
            style={styles.signUpButton}
          />
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Already have an account? </Text>
          <TouchableOpacity
            onPress={() => navigation.navigate('Login')}
            disabled={loading}
            testID="login-link"
          >
            <Text style={styles.linkText}>Login</Text>
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
    marginTop: -40,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
  },
  title: {
    ...typography.heading4,
    color: theme.colors.textPrimary,
    textAlign: 'center',
    marginBottom: theme.spacing['4xl'],
  },
  form: {
    marginBottom: theme.spacing['3xl'],
  },
  field: {
    marginBottom: theme.spacing.lg,
  },
  signUpButton: {
    marginTop: theme.spacing.sm,
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
